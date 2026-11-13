/**
 * Motor Server-Side de Cotações Financeiras Reais (Yahoo Finance v8 + Coinbase Spot)
 * Busca em tempo real e histórico real para:
 * - Dólar Comercial (USDBRL=X)
 * - Euro Comercial (EURBRL=X)
 * - Ouro 24k (GC=F COMEX convertido para R$/grama via USDBRL=X + US$/oz)
 * - Bitcoin (Coinbase Spot BTC-BRL + histórico BTC-USD convertido via USDBRL=X)
 */

import type {
  FinancialAssetId,
  FinancialAssetQuote,
  FinancialHistoryPoint,
  FinancialMarketsResponse,
  FinancialPeriod,
} from './financialMarketsService';

const TROY_OUNCE_IN_GRAMS = 31.1034768;

const PERIOD_TO_YAHOO_PARAMS: Record<
  FinancialPeriod,
  { range: string; interval: string; ttlMs: number }
> = {
  '1d': { range: '1d', interval: '15m', ttlMs: 25_000 },
  '5d': { range: '5d', interval: '1h', ttlMs: 30_000 },
  '1mo': { range: '1mo', interval: '1d', ttlMs: 60_000 },
  '3mo': { range: '3mo', interval: '1d', ttlMs: 90_000 },
  '6mo': { range: '6mo', interval: '1d', ttlMs: 120_000 },
  '1y': { range: '1y', interval: '1d', ttlMs: 180_000 },
};

interface YahooChartPoint {
  ts: number; // ms
  close: number;
}

interface YahooChartSeries {
  symbol: string;
  regularMarketPrice: number;
  previousClose: number;
  regularMarketTimeMs: number;
  points: YahooChartPoint[];
}

interface CacheEntry {
  expiresAt: number;
  data: FinancialMarketsResponse;
}

const cacheByPeriod = new Map<FinancialPeriod, CacheEntry>();

const dailyPrevCloseCache: {
  expiresAt: number;
  values: {
    usdPrev: number;
    eurPrev: number;
    goldPrevUsd: number;
    btcPrevUsd: number;
  } | null;
} = { expiresAt: 0, values: null };

function formatDateSaoPaulo(tsMs: number, period: FinancialPeriod): {
  isoDate: string;
  dateLabel: string;
  fullDate: string;
} {
  const d = new Date(tsMs);
  const isoParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = isoParts.find(p => p.type === 'year')?.value || '2026';
  const month = isoParts.find(p => p.type === 'month')?.value || '01';
  const day = isoParts.find(p => p.type === 'day')?.value || '01';
  const isoDate = `${year}-${month}-${day}`;

  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);

  const shortDate = `${day}/${month}`;
  const fullDateOnly = `${day}/${month}/${year}`;

  if (period === '1d') {
    return {
      isoDate,
      dateLabel: timeStr,
      fullDate: `${fullDateOnly} ${timeStr}`,
    };
  }
  if (period === '5d') {
    return {
      isoDate,
      dateLabel: `${shortDate} ${timeStr.slice(0, 2)}h`,
      fullDate: `${fullDateOnly} ${timeStr}`,
    };
  }
  return {
    isoDate,
    dateLabel: shortDate,
    fullDate: fullDateOnly,
  };
}

function formatNowSaoPaulo(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}

async function fetchYahooChart(
  symbol: string,
  range: string,
  interval: string
): Promise<YahooChartSeries> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance HTTP ${response.status} para ${symbol}`);
  }

  const json: any = await response.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    const errDesc = json?.chart?.error?.description || 'Sem dados de gráfico';
    throw new Error(`Yahoo Finance erro (${symbol}): ${errDesc}`);
  }

  const meta = result.meta || {};
  const timestamps: number[] = Array.isArray(result.timestamp) ? result.timestamp : [];
  const closes: Array<number | null> = Array.isArray(result.indicators?.quote?.[0]?.close)
    ? result.indicators.quote[0].close
    : [];

  const points: YahooChartPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const tsSec = timestamps[i];
    const closeVal = closes[i];
    if (typeof tsSec === 'number' && typeof closeVal === 'number' && Number.isFinite(closeVal) && closeVal > 0) {
      points.push({
        ts: tsSec * 1000,
        close: closeVal,
      });
    }
  }

  const regularMarketPrice =
    typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0
      ? meta.regularMarketPrice
      : points[points.length - 1]?.close || 0;

  const previousClose =
    typeof meta.chartPreviousClose === 'number' && meta.chartPreviousClose > 0
      ? meta.chartPreviousClose
      : typeof meta.previousClose === 'number' && meta.previousClose > 0
      ? meta.previousClose
      : points[0]?.close || regularMarketPrice;

  const regularMarketTimeMs =
    typeof meta.regularMarketTime === 'number' && meta.regularMarketTime > 0
      ? meta.regularMarketTime * 1000
      : points[points.length - 1]?.ts || Date.now();

  return {
    symbol,
    regularMarketPrice,
    previousClose,
    regularMarketTimeMs,
    points,
  };
}

async function fetchCoinbaseSpot(pair: 'BTC-BRL' | 'BTC-USD'): Promise<number | null> {
  try {
    const response = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const json: any = await response.json();
    const amount = Number(json?.data?.amount);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  } catch {
    return null;
  }
}

async function getOfficialDailyPrevCloses(): Promise<{
  usdPrev: number;
  eurPrev: number;
  goldPrevUsd: number;
  btcPrevUsd: number;
}> {
  if (dailyPrevCloseCache.values && Date.now() < dailyPrevCloseCache.expiresAt) {
    return dailyPrevCloseCache.values;
  }
  const [u, e, g, b] = await Promise.all([
    fetchYahooChart('USDBRL=X', '1d', '1d'),
    fetchYahooChart('EURBRL=X', '1d', '1d'),
    fetchYahooChart('GC=F', '1d', '1d'),
    fetchYahooChart('BTC-USD', '1d', '1d'),
  ]);
  const values = {
    usdPrev: u.previousClose,
    eurPrev: e.previousClose,
    goldPrevUsd: g.previousClose,
    btcPrevUsd: b.previousClose,
  };
  dailyPrevCloseCache.values = values;
  dailyPrevCloseCache.expiresAt = Date.now() + 60_000;
  return values;
}

function appendLivePointIfNewer(
  history: FinancialHistoryPoint[],
  liveTsMs: number,
  period: FinancialPeriod,
  liveValueBrl: number,
  liveValueUsd?: number
): FinancialHistoryPoint[] {
  const formatted = formatDateSaoPaulo(liveTsMs, period);
  const last = history[history.length - 1];
  if (!last) {
    return [
      {
        timestamp: liveTsMs,
        ...formatted,
        valueBrl: liveValueBrl,
        valueUsd: liveValueUsd,
      },
    ];
  }
  if (formatted.isoDate > last.isoDate) {
    return [
      ...history,
      {
        timestamp: liveTsMs,
        ...formatted,
        valueBrl: liveValueBrl,
        valueUsd: liveValueUsd,
      },
    ];
  }
  return history;
}

/**
 * Encontra a taxa de câmbio USD/BRL mais próxima no passado (ou a mais próxima disponível)
 * para converter séries históricas em USD (Ouro COMEX e Bitcoin) para BRL com fidelidade.
 */
function findClosestFxRate(fxPoints: YahooChartPoint[], targetTs: number, fallbackRate: number): number {
  if (!fxPoints.length) return fallbackRate;
  let lo = 0;
  let hi = fxPoints.length - 1;
  let bestIdx = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (fxPoints[mid].ts <= targetTs) {
      bestIdx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return fxPoints[bestIdx]?.close || fallbackRate;
}

function buildAssetStats(
  id: FinancialAssetId,
  config: {
    ticker: string;
    name: string;
    subtitle: string;
    unitLabel: string;
    secondaryUnitLabel?: string;
    source: string;
    marketStatus: 'PREGÃO ATIVO' | '24/7 SPOT' | 'FECHADO';
  },
  priceBrl: number,
  previousCloseBrl: number,
  history: FinancialHistoryPoint[],
  secondaryPriceUsd?: number,
  updatedAtMs?: number
): FinancialAssetQuote {
  const effectiveHistory =
    history.length > 0
      ? history
      : [
          {
            timestamp: updatedAtMs || Date.now(),
            ...formatDateSaoPaulo(updatedAtMs || Date.now(), '1d'),
            valueBrl: priceBrl,
            valueUsd: secondaryPriceUsd,
          },
        ];

  const openInPeriodBrl = effectiveHistory[0].valueBrl;
  const lastInPeriodBrl = effectiveHistory[effectiveHistory.length - 1].valueBrl;

  let highInPeriodBrl = priceBrl;
  let lowInPeriodBrl = priceBrl;
  for (const pt of effectiveHistory) {
    if (pt.valueBrl > highInPeriodBrl) highInPeriodBrl = pt.valueBrl;
    if (pt.valueBrl < lowInPeriodBrl) lowInPeriodBrl = pt.valueBrl;
  }

  const changeAbsBrl24h = priceBrl - previousCloseBrl;
  const changePercent24h = previousCloseBrl > 0 ? (changeAbsBrl24h / previousCloseBrl) * 100 : 0;

  const referenceLast = priceBrl > 0 ? priceBrl : lastInPeriodBrl;
  const periodChangeAbsBrl = referenceLast - openInPeriodBrl;
  const periodChangePercent = openInPeriodBrl > 0 ? (periodChangeAbsBrl / openInPeriodBrl) * 100 : 0;

  const updatedDate = new Date(updatedAtMs || Date.now());
  const updatedAtIso = updatedDate.toISOString();
  const updatedAtFormatted = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(updatedDate);

  return {
    id,
    ticker: config.ticker,
    name: config.name,
    subtitle: config.subtitle,
    unitLabel: config.unitLabel,
    secondaryUnitLabel: config.secondaryUnitLabel,
    priceBrl,
    secondaryPriceUsd,
    previousCloseBrl,
    changePercent24h,
    changeAbsBrl24h,
    openInPeriodBrl,
    highInPeriodBrl,
    lowInPeriodBrl,
    periodChangePercent,
    periodChangeAbsBrl,
    source: config.source,
    marketStatus: config.marketStatus,
    updatedAtIso,
    updatedAtFormatted,
    history: effectiveHistory,
  };
}

export async function getRealFinancialMarkets(
  period: FinancialPeriod = '1mo',
  forceFresh = false
): Promise<FinancialMarketsResponse> {
  const cfg = PERIOD_TO_YAHOO_PARAMS[period] || PERIOD_TO_YAHOO_PARAMS['1mo'];
  const cached = cacheByPeriod.get(period);
  if (!forceFresh && cached && Date.now() < cached.expiresAt) {
    return {
      ...cached.data,
      fromCache: true,
    };
  }

  const startMs = Date.now();

  try {
    // Dispara todas as consultas reais em paralelo
    const [
      usdSeries,
      eurSeries,
      goldSeries,
      btcUsdSeries,
      coinbaseBtcBrl,
      coinbaseBtcUsd,
      officialPrevCloses,
    ] = await Promise.all([
      fetchYahooChart('USDBRL=X', cfg.range, cfg.interval),
      fetchYahooChart('EURBRL=X', cfg.range, cfg.interval),
      fetchYahooChart('GC=F', cfg.range, cfg.interval),
      fetchYahooChart('BTC-USD', cfg.range, cfg.interval),
      fetchCoinbaseSpot('BTC-BRL'),
      fetchCoinbaseSpot('BTC-USD'),
      period === '1d' ? Promise.resolve(null) : getOfficialDailyPrevCloses(),
    ]);

    const usdPrevClose = officialPrevCloses ? officialPrevCloses.usdPrev : usdSeries.previousClose;
    const eurPrevClose = officialPrevCloses ? officialPrevCloses.eurPrev : eurSeries.previousClose;
    const goldPrevCloseUsd = officialPrevCloses
      ? officialPrevCloses.goldPrevUsd
      : goldSeries.previousClose;
    const btcPrevCloseUsd = officialPrevCloses
      ? officialPrevCloses.btcPrevUsd
      : btcUsdSeries.previousClose;

    if (period === '1d') {
      dailyPrevCloseCache.values = {
        usdPrev: usdSeries.previousClose,
        eurPrev: eurSeries.previousClose,
        goldPrevUsd: goldSeries.previousClose,
        btcPrevUsd: btcUsdSeries.previousClose,
      };
      dailyPrevCloseCache.expiresAt = Date.now() + 60_000;
    }

    // 1. Dólar Comercial (USD/BRL)
    const usdHistoryRaw: FinancialHistoryPoint[] = usdSeries.points.map(pt => ({
      timestamp: pt.ts,
      ...formatDateSaoPaulo(pt.ts, period),
      valueBrl: Number(pt.close.toFixed(4)),
    }));
    const usdHistory = appendLivePointIfNewer(
      usdHistoryRaw,
      usdSeries.regularMarketTimeMs,
      period,
      Number(usdSeries.regularMarketPrice.toFixed(4))
    );
    const usdAsset = buildAssetStats(
      'USD',
      {
        ticker: 'USD/BRL',
        name: 'Dólar Comercial',
        subtitle: 'PTAX / Câmbio Spot Interbancário',
        unitLabel: 'R$ / US$ 1,00',
        source: 'Yahoo Finance / FX Global',
        marketStatus: 'PREGÃO ATIVO',
      },
      usdSeries.regularMarketPrice,
      usdPrevClose,
      usdHistory,
      1,
      usdSeries.regularMarketTimeMs
    );

    // 2. Euro Comercial (EUR/BRL)
    const eurHistoryRaw: FinancialHistoryPoint[] = eurSeries.points.map(pt => ({
      timestamp: pt.ts,
      ...formatDateSaoPaulo(pt.ts, period),
      valueBrl: Number(pt.close.toFixed(4)),
    }));
    const eurHistory = appendLivePointIfNewer(
      eurHistoryRaw,
      eurSeries.regularMarketTimeMs,
      period,
      Number(eurSeries.regularMarketPrice.toFixed(4))
    );
    const eurAsset = buildAssetStats(
      'EUR',
      {
        ticker: 'EUR/BRL',
        name: 'Euro Comercial',
        subtitle: 'Câmbio Zona do Euro Spot',
        unitLabel: 'R$ / € 1,00',
        source: 'Yahoo Finance / FX Global',
        marketStatus: 'PREGÃO ATIVO',
      },
      eurSeries.regularMarketPrice,
      eurPrevClose,
      eurHistory,
      undefined,
      eurSeries.regularMarketTimeMs
    );

    // 3. Ouro 24k (COMEX GC=F USD/oz -> R$/grama via USDBRL=X)
    const goldSpotBrlGram =
      (goldSeries.regularMarketPrice / TROY_OUNCE_IN_GRAMS) * usdSeries.regularMarketPrice;
    const goldPrevCloseBrlGram = (goldPrevCloseUsd / TROY_OUNCE_IN_GRAMS) * usdPrevClose;

    const goldHistoryRaw: FinancialHistoryPoint[] = goldSeries.points.map(pt => {
      const fx = findClosestFxRate(usdSeries.points, pt.ts, usdSeries.regularMarketPrice);
      const gramBrl = (pt.close / TROY_OUNCE_IN_GRAMS) * fx;
      return {
        timestamp: pt.ts,
        ...formatDateSaoPaulo(pt.ts, period),
        valueBrl: Number(gramBrl.toFixed(2)),
        valueUsd: Number(pt.close.toFixed(2)),
      };
    });
    const goldHistory = appendLivePointIfNewer(
      goldHistoryRaw,
      goldSeries.regularMarketTimeMs,
      period,
      Number(goldSpotBrlGram.toFixed(2)),
      Number(goldSeries.regularMarketPrice.toFixed(2))
    );

    const goldAsset = buildAssetStats(
      'GOLD',
      {
        ticker: 'XAU/BRL',
        name: 'Ouro 24k (Grama)',
        subtitle: 'COMEX Futuros (GC=F) convertido p/ grama BRL',
        unitLabel: 'R$ / grama (24k)',
        secondaryUnitLabel: 'US$ / onça troy',
        source: 'COMEX / Yahoo Finance',
        marketStatus: 'PREGÃO ATIVO',
      },
      Number(goldSpotBrlGram.toFixed(2)),
      Number(goldPrevCloseBrlGram.toFixed(2)),
      goldHistory,
      Number(goldSeries.regularMarketPrice.toFixed(2)),
      goldSeries.regularMarketTimeMs
    );

    // 4. Bitcoin (BTC/BRL + BTC/USD)
    const btcSpotUsd = coinbaseBtcUsd || btcUsdSeries.regularMarketPrice;
    const btcSpotBrl =
      coinbaseBtcBrl || btcUsdSeries.regularMarketPrice * usdSeries.regularMarketPrice;

    const btcPrevCloseBrl = btcPrevCloseUsd * usdPrevClose;

    const btcHistoryRaw: FinancialHistoryPoint[] = btcUsdSeries.points.map(pt => {
      const fx = findClosestFxRate(usdSeries.points, pt.ts, usdSeries.regularMarketPrice);
      const valBrl = pt.close * fx;
      return {
        timestamp: pt.ts,
        ...formatDateSaoPaulo(pt.ts, period),
        valueBrl: Number(valBrl.toFixed(2)),
        valueUsd: Number(pt.close.toFixed(2)),
      };
    });

    const btcHistory = appendLivePointIfNewer(
      btcHistoryRaw,
      Date.now(),
      period,
      Number(btcSpotBrl.toFixed(2)),
      Number(btcSpotUsd.toFixed(2))
    );

    // Atualiza o ponto final do histórico do Bitcoin com o spot real-time da Coinbase caso esteja disponível
    if (coinbaseBtcBrl && btcHistory.length > 0) {
      const last = btcHistory[btcHistory.length - 1];
      btcHistory[btcHistory.length - 1] = {
        ...last,
        valueBrl: Number(coinbaseBtcBrl.toFixed(2)),
        valueUsd: Number(btcSpotUsd.toFixed(2)),
      };
    }

    const btcAsset = buildAssetStats(
      'BTC',
      {
        ticker: 'BTC/BRL',
        name: 'Bitcoin Spot',
        subtitle: 'Cripto Mercado Global 24/7 (BRL & USD)',
        unitLabel: 'R$ / 1 BTC',
        secondaryUnitLabel: 'US$ / 1 BTC',
        source: coinbaseBtcBrl ? 'Coinbase Spot + Yahoo' : 'Yahoo Finance Cripto',
        marketStatus: '24/7 SPOT',
      },
      Number(btcSpotBrl.toFixed(2)),
      Number(btcPrevCloseBrl.toFixed(2)),
      btcHistory,
      Number(btcSpotUsd.toFixed(2)),
      Date.now()
    );

    const payload: FinancialMarketsResponse = {
      period,
      fetchedAtIso: new Date().toISOString(),
      fetchedAtFormatted: formatNowSaoPaulo(),
      latencyMs: Date.now() - startMs,
      fromCache: false,
      assets: [usdAsset, eurAsset, goldAsset, btcAsset],
    };

    cacheByPeriod.set(period, {
      expiresAt: Date.now() + cfg.ttlMs,
      data: payload,
    });

    return payload;
  } catch (err) {
    if (cached?.data) {
      console.warn('[FinancialMarketsServer] Fallback para último snapshot válido:', err);
      return {
        ...cached.data,
        fromCache: true,
      };
    }
    throw err;
  }
}
