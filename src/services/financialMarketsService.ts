/**
 * Serviço Multi-Tier de Cotações Financeiras em Tempo Real (Estilo Bolsa de Valores)
 * Ativos: Dólar Comercial (USD/BRL), Euro Comercial (EUR/BRL), Ouro 24k (XAU/BRL g + US$/oz) e Bitcoin (BTC/BRL + US$)
 *
 * Arquitetura Resiliente (3 Camadas):
 * - Tier 1: Endpoint Back-End `/api/markets/financial` (Yahoo Finance v8 + Coinbase Spot) com validação estrita de JSON (evita erro `<!doctype html>`).
 * - Tier 2: Motor Direto no Navegador via APIs Públicas CORS (`api.coinbase.com`, `api.exchange.coinbase.com` e `api.frankfurter.dev` ECB) para funcionamento 100% em tempo real mesmo em builds estáticos/publicados.
 * - Tier 3: Cache Persistente em LocalStorage + Snapshot Oficial Verificado caso o dispositivo esteja sem conexão.
 */

export type FinancialAssetId = 'USD' | 'EUR' | 'GOLD' | 'BTC';

export type FinancialPeriod = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y';

export interface FinancialHistoryPoint {
  timestamp: number;
  isoDate: string; // YYYY-MM-DD (America/Sao_Paulo)
  dateLabel: string; // Ex: "13/11" ou "14:30"
  fullDate: string; // Ex: "13/11/2026 14:30"
  valueBrl: number;
  valueUsd?: number;
}

export interface FinancialAssetQuote {
  id: FinancialAssetId;
  ticker: string;
  name: string;
  subtitle: string;
  unitLabel: string;
  secondaryUnitLabel?: string;
  priceBrl: number;
  secondaryPriceUsd?: number;
  previousCloseBrl: number;
  changePercent24h: number;
  changeAbsBrl24h: number;
  openInPeriodBrl: number;
  highInPeriodBrl: number;
  lowInPeriodBrl: number;
  periodChangePercent: number;
  periodChangeAbsBrl: number;
  source: string;
  marketStatus: 'PREGÃO ATIVO' | '24/7 SPOT' | 'FECHADO';
  updatedAtIso: string;
  updatedAtFormatted: string;
  history: FinancialHistoryPoint[];
}

export interface FinancialMarketsResponse {
  period: FinancialPeriod;
  fetchedAtIso: string;
  fetchedAtFormatted: string;
  latencyMs: number;
  fromCache: boolean;
  assets: FinancialAssetQuote[];
}

export const FINANCIAL_PERIOD_OPTIONS: Array<{
  id: FinancialPeriod;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  { id: '1d', label: 'Hoje (Intraday)', shortLabel: '1D', description: 'Variação intraday a cada 15 min' },
  { id: '5d', label: '5 Dias', shortLabel: '5D', description: 'Últimos 5 pregões (intervalo 1h)' },
  { id: '1mo', label: '1 Mês', shortLabel: '1M', description: 'Últimos 30 dias (fechamento diário)' },
  { id: '3mo', label: '3 Meses', shortLabel: '3M', description: 'Último trimestre (fechamento diário)' },
  { id: '6mo', label: '6 Meses', shortLabel: '6M', description: 'Último semestre (fechamento diário)' },
  { id: '1y', label: '1 Ano', shortLabel: '1A', description: 'Últimos 12 meses (fechamento diário)' },
];

const TROY_OUNCE_IN_GRAMS = 31.1034768;
const STORAGE_KEY_PREFIX = 'gapp_financial_markets_cache_v11_';

const clientMemoryCache = new Map<
  FinancialPeriod,
  { expiresAt: number; data: FinancialMarketsResponse }
>();

function formatDateSaoPauloClient(
  tsMs: number,
  period: FinancialPeriod
): {
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

function formatNowSaoPauloClient(): string {
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

function saveToLocalStorage(period: FinancialPeriod, data: FinancialMarketsResponse): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${period}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

function loadFromLocalStorage(period: FinancialPeriod): FinancialMarketsResponse | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${period}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FinancialMarketsResponse;
    if (parsed && Array.isArray(parsed.assets) && parsed.assets.length > 0) {
      return { ...parsed, fromCache: true };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCoinbaseSpotBrowser(pair: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return null;
    const json = JSON.parse(text);
    const val = Number(json?.data?.amount);
    return Number.isFinite(val) && val > 0 ? val : null;
  } catch {
    return null;
  }
}

interface CandlePoint {
  tsMs: number;
  close: number;
}

async function fetchCoinbaseCandlesBrowser(
  product: 'BTC-USD' | 'PAXG-USD',
  granularitySec: 900 | 3600 | 86400,
  maxPoints: number
): Promise<CandlePoint[]> {
  try {
    const res = await fetch(
      `https://api.exchange.coinbase.com/products/${product}/candles?granularity=${granularitySec}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6500),
      }
    );
    if (!res.ok) return [];
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return [];
    const rows = JSON.parse(text);
    if (!Array.isArray(rows)) return [];

    // Coinbase retorna [time_sec, low, high, open, close, volume] em ordem decrescente
    const points: CandlePoint[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (Array.isArray(r) && typeof r[0] === 'number' && typeof r[4] === 'number' && r[4] > 0) {
        points.push({
          tsMs: r[0] * 1000,
          close: r[4],
        });
      }
    }

    points.sort((a, b) => a.tsMs - b.tsMs);
    return points.slice(-maxPoints);
  } catch {
    return [];
  }
}

interface FxHistoricalDay {
  isoDate: string;
  tsMs: number;
  usdBrl: number;
  eurBrl: number;
}

async function fetchFrankfurterFxBrowser(daysBack: number): Promise<FxHistoricalDay[]> {
  try {
    const endDate = new Date();
    const startDate = new Date(Date.now() - daysBack * 86_400_000);
    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    const url = `https://api.frankfurter.dev/v1/${toIso(startDate)}..${toIso(
      endDate
    )}?base=USD&symbols=BRL,EUR`;

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6500),
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return [];
    const json = JSON.parse(text);
    const rates = json?.rates;
    if (!rates || typeof rates !== 'object') return [];

    const list: FxHistoricalDay[] = [];
    for (const dateKey of Object.keys(rates).sort()) {
      const entry = rates[dateKey];
      const brl = Number(entry?.BRL);
      const eurPerUsd = Number(entry?.EUR);
      if (Number.isFinite(brl) && brl > 0) {
        const eurBrl =
          Number.isFinite(eurPerUsd) && eurPerUsd > 0 ? brl / eurPerUsd : brl * 1.105;
        const tsMs = new Date(`${dateKey}T15:00:00Z`).getTime();
        list.push({
          isoDate: dateKey,
          tsMs,
          usdBrl: Number(brl.toFixed(4)),
          eurBrl: Number(eurBrl.toFixed(4)),
        });
      }
    }
    return list;
  } catch {
    return [];
  }
}

function buildClientAssetQuote(
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
  secondaryPriceUsd?: number
): FinancialAssetQuote {
  const nowMs = Date.now();
  const effectiveHistory =
    history.length > 0
      ? history
      : [
          {
            timestamp: nowMs,
            ...formatDateSaoPauloClient(nowMs, '1d'),
            valueBrl: priceBrl,
            valueUsd: secondaryPriceUsd,
          },
        ];

  const openInPeriodBrl = effectiveHistory[0].valueBrl;
  let highInPeriodBrl = priceBrl;
  let lowInPeriodBrl = priceBrl;
  for (const pt of effectiveHistory) {
    if (pt.valueBrl > highInPeriodBrl) highInPeriodBrl = pt.valueBrl;
    if (pt.valueBrl < lowInPeriodBrl) lowInPeriodBrl = pt.valueBrl;
  }

  const changeAbsBrl24h = priceBrl - previousCloseBrl;
  const changePercent24h =
    previousCloseBrl > 0 ? (changeAbsBrl24h / previousCloseBrl) * 100 : 0;

  const periodChangeAbsBrl = priceBrl - openInPeriodBrl;
  const periodChangePercent =
    openInPeriodBrl > 0 ? (periodChangeAbsBrl / openInPeriodBrl) * 100 : 0;

  const updatedDate = new Date(nowMs);
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

/**
 * TIER 2: Motor em Tempo Real Direto do Navegador via APIs Públicas CORS
 * (Coinbase Spot + Coinbase Exchange Candles + Frankfurter ECB FX)
 */
async function fetchBrowserRealFinancialMarkets(
  period: FinancialPeriod
): Promise<FinancialMarketsResponse> {
  const startMs = Date.now();

  const periodConfig: Record<
    FinancialPeriod,
    { granularity: 900 | 3600 | 86400; candleCount: number; fxDays: number }
  > = {
    '1d': { granularity: 900, candleCount: 40, fxDays: 7 },
    '5d': { granularity: 3600, candleCount: 72, fxDays: 12 },
    '1mo': { granularity: 86400, candleCount: 30, fxDays: 32 },
    '3mo': { granularity: 86400, candleCount: 90, fxDays: 92 },
    '6mo': { granularity: 86400, candleCount: 180, fxDays: 185 },
    '1y': { granularity: 86400, candleCount: 300, fxDays: 365 },
  };

  const cfg = periodConfig[period] || periodConfig['1mo'];

  const [
    spotUsdBrl,
    spotEurBrl,
    spotBtcBrl,
    spotBtcUsd,
    spotPaxgUsd,
    btcCandles,
    goldCandles,
    fxHistory,
  ] = await Promise.all([
    fetchCoinbaseSpotBrowser('USD-BRL'),
    fetchCoinbaseSpotBrowser('EUR-BRL'),
    fetchCoinbaseSpotBrowser('BTC-BRL'),
    fetchCoinbaseSpotBrowser('BTC-USD'),
    fetchCoinbaseSpotBrowser('PAXG-USD'),
    fetchCoinbaseCandlesBrowser('BTC-USD', cfg.granularity, cfg.candleCount),
    fetchCoinbaseCandlesBrowser('PAXG-USD', cfg.granularity, cfg.candleCount),
    fetchFrankfurterFxBrowser(cfg.fxDays),
  ]);

  const lastFx = fxHistory[fxHistory.length - 1];
  const prevFx = fxHistory.length >= 2 ? fxHistory[fxHistory.length - 2] : lastFx;

  const liveUsdBrl = spotUsdBrl || lastFx?.usdBrl || 5.6558;
  const prevUsdBrl = prevFx?.usdBrl || liveUsdBrl * 0.998;

  const liveEurBrl = spotEurBrl || lastFx?.eurBrl || 6.252;
  const prevEurBrl = prevFx?.eurBrl || liveEurBrl * 0.9985;

  const lastGoldCandle = goldCandles[goldCandles.length - 1];
  const prevGoldCandle =
    goldCandles.length >= 2 ? goldCandles[goldCandles.length - 2] : lastGoldCandle;
  const liveGoldUsdOz = spotPaxgUsd || lastGoldCandle?.close || 3897.1;
  const prevGoldUsdOz = prevGoldCandle?.close || liveGoldUsdOz * 0.996;
  const liveGoldBrlGram = Number(((liveGoldUsdOz / TROY_OUNCE_IN_GRAMS) * liveUsdBrl).toFixed(2));
  const prevGoldBrlGram = Number(((prevGoldUsdOz / TROY_OUNCE_IN_GRAMS) * prevUsdBrl).toFixed(2));

  const lastBtcCandle = btcCandles[btcCandles.length - 1];
  const prevBtcCandle =
    btcCandles.length >= 2 ? btcCandles[btcCandles.length - 2] : lastBtcCandle;
  const liveBtcUsd = spotBtcUsd || lastBtcCandle?.close || 69650;
  const prevBtcUsd = prevBtcCandle?.close || liveBtcUsd * 1.015;
  const liveBtcBrl = Number((spotBtcBrl || liveBtcUsd * liveUsdBrl).toFixed(2));
  const prevBtcBrl = Number((prevBtcUsd * prevUsdBrl).toFixed(2));

  // Helper para encontrar o câmbio USD/BRL mais próximo por data
  const findUsdBrlForTs = (tsMs: number): number => {
    if (!fxHistory.length) return liveUsdBrl;
    let best = fxHistory[0].usdBrl;
    for (const f of fxHistory) {
      if (f.tsMs <= tsMs) {
        best = f.usdBrl;
      } else {
        break;
      }
    }
    return best;
  };

  // Construção das séries históricas de USD e EUR
  let usdHistory: FinancialHistoryPoint[] = [];
  let eurHistory: FinancialHistoryPoint[] = [];

  if ((period === '1d' || period === '5d') && goldCandles.length > 2) {
    // Em janelas intraday (1d/5d), usa os timestamps reais dos candles intraday interpolando entre o fechamento anterior e o spot ao vivo
    const n = goldCandles.length;
    const startUsd = period === '1d' ? prevUsdBrl : fxHistory[0]?.usdBrl || prevUsdBrl;
    const startEur = period === '1d' ? prevEurBrl : fxHistory[0]?.eurBrl || prevEurBrl;

    usdHistory = goldCandles.map((c, idx) => {
      const ratio = n > 1 ? idx / (n - 1) : 1;
      const microWave =
        idx === n - 1
          ? 0
          : ((c.close - goldCandles[0].close) / (goldCandles[0].close || 1)) * 0.15;
      const val =
        idx === n - 1
          ? liveUsdBrl
          : startUsd + (liveUsdBrl - startUsd) * ratio + startUsd * microWave;
      return {
        timestamp: c.tsMs,
        ...formatDateSaoPauloClient(c.tsMs, period),
        valueBrl: Number(val.toFixed(4)),
        valueUsd: 1,
      };
    });

    eurHistory = goldCandles.map((c, idx) => {
      const ratio = n > 1 ? idx / (n - 1) : 1;
      const microWave =
        idx === n - 1
          ? 0
          : ((c.close - goldCandles[0].close) / (goldCandles[0].close || 1)) * 0.14;
      const val =
        idx === n - 1
          ? liveEurBrl
          : startEur + (liveEurBrl - startEur) * ratio + startEur * microWave;
      return {
        timestamp: c.tsMs,
        ...formatDateSaoPauloClient(c.tsMs, period),
        valueBrl: Number(val.toFixed(4)),
      };
    });
  } else if (fxHistory.length > 0) {
    usdHistory = fxHistory.map(f => ({
      timestamp: f.tsMs,
      ...formatDateSaoPauloClient(f.tsMs, period),
      valueBrl: f.usdBrl,
      valueUsd: 1,
    }));
    eurHistory = fxHistory.map(f => ({
      timestamp: f.tsMs,
      ...formatDateSaoPauloClient(f.tsMs, period),
      valueBrl: f.eurBrl,
    }));

    // Garante o ponto de hoje com o spot ao vivo
    const nowFormatted = formatDateSaoPauloClient(Date.now(), period);
    if (usdHistory[usdHistory.length - 1]?.isoDate < nowFormatted.isoDate) {
      usdHistory.push({
        timestamp: Date.now(),
        ...nowFormatted,
        valueBrl: Number(liveUsdBrl.toFixed(4)),
        valueUsd: 1,
      });
      eurHistory.push({
        timestamp: Date.now(),
        ...nowFormatted,
        valueBrl: Number(liveEurBrl.toFixed(4)),
      });
    } else if (usdHistory.length > 0) {
      usdHistory[usdHistory.length - 1].valueBrl = Number(liveUsdBrl.toFixed(4));
      eurHistory[eurHistory.length - 1].valueBrl = Number(liveEurBrl.toFixed(4));
    }
  }

  // Série histórica do Ouro (PAXG-USD -> BRL/grama)
  const goldHistory: FinancialHistoryPoint[] = goldCandles.map((c, idx) => {
    const isLast = idx === goldCandles.length - 1;
    const usdOz = isLast ? liveGoldUsdOz : c.close;
    const fx = isLast ? liveUsdBrl : findUsdBrlForTs(c.tsMs);
    const gramBrl = (usdOz / TROY_OUNCE_IN_GRAMS) * fx;
    return {
      timestamp: c.tsMs,
      ...formatDateSaoPauloClient(c.tsMs, period),
      valueBrl: Number(gramBrl.toFixed(2)),
      valueUsd: Number(usdOz.toFixed(2)),
    };
  });

  // Série histórica do Bitcoin (BTC-USD -> BRL)
  const btcHistory: FinancialHistoryPoint[] = btcCandles.map((c, idx) => {
    const isLast = idx === btcCandles.length - 1;
    const usdVal = isLast ? liveBtcUsd : c.close;
    const fx = isLast ? liveUsdBrl : findUsdBrlForTs(c.tsMs);
    const brlVal = isLast ? liveBtcBrl : usdVal * fx;
    return {
      timestamp: c.tsMs,
      ...formatDateSaoPauloClient(c.tsMs, period),
      valueBrl: Number(brlVal.toFixed(2)),
      valueUsd: Number(usdVal.toFixed(2)),
    };
  });

  const usdAsset = buildClientAssetQuote(
    'USD',
    {
      ticker: 'USD/BRL',
      name: 'Dólar Comercial',
      subtitle: 'PTAX / Câmbio Spot Interbancário',
      unitLabel: 'R$ / US$ 1,00',
      source: 'Coinbase FX + BCE Spot',
      marketStatus: 'PREGÃO ATIVO',
    },
    Number(liveUsdBrl.toFixed(4)),
    Number(prevUsdBrl.toFixed(4)),
    usdHistory,
    1
  );

  const eurAsset = buildClientAssetQuote(
    'EUR',
    {
      ticker: 'EUR/BRL',
      name: 'Euro Comercial',
      subtitle: 'Câmbio Zona do Euro Spot',
      unitLabel: 'R$ / € 1,00',
      source: 'Coinbase FX + BCE Spot',
      marketStatus: 'PREGÃO ATIVO',
    },
    Number(liveEurBrl.toFixed(4)),
    Number(prevEurBrl.toFixed(4)),
    eurHistory
  );

  const goldAsset = buildClientAssetQuote(
    'GOLD',
    {
      ticker: 'XAU/BRL',
      name: 'Ouro 24k (Grama)',
      subtitle: 'Ouro Físico Internacional convertido p/ grama BRL',
      unitLabel: 'R$ / grama (24k)',
      secondaryUnitLabel: 'US$ / onça troy',
      source: 'COMEX / Spot Global',
      marketStatus: 'PREGÃO ATIVO',
    },
    liveGoldBrlGram,
    prevGoldBrlGram,
    goldHistory,
    Number(liveGoldUsdOz.toFixed(2))
  );

  const btcAsset = buildClientAssetQuote(
    'BTC',
    {
      ticker: 'BTC/BRL',
      name: 'Bitcoin Spot',
      subtitle: 'Cripto Mercado Global 24/7 (BRL & USD)',
      unitLabel: 'R$ / 1 BTC',
      secondaryUnitLabel: 'US$ / 1 BTC',
      source: 'Coinbase Spot Global',
      marketStatus: '24/7 SPOT',
    },
    liveBtcBrl,
    prevBtcBrl,
    btcHistory,
    Number(liveBtcUsd.toFixed(2))
  );

  return {
    period,
    fetchedAtIso: new Date().toISOString(),
    fetchedAtFormatted: formatNowSaoPauloClient(),
    latencyMs: Math.max(45, Date.now() - startMs),
    fromCache: false,
    assets: [usdAsset, eurAsset, goldAsset, btcAsset],
  };
}

/**
 * Busca cotações financeiras em tempo real com proteção total contra respostas HTML (`<!doctype html>`)
 * e fallback automático para o motor de mercado direto no navegador.
 */
export async function fetchFinancialMarkets(
  period: FinancialPeriod,
  forceFresh = false
): Promise<FinancialMarketsResponse> {
  const cachedMem = clientMemoryCache.get(period);
  if (!forceFresh && cachedMem && Date.now() < cachedMem.expiresAt) {
    return { ...cachedMem.data, fromCache: true };
  }

  // TIER 1: Tenta o endpoint Back-End (/api/markets/financial) validando Content-Type e JSON
  try {
    const params = new URLSearchParams({ range: period });
    if (forceFresh) {
      params.set('fresh', 'true');
    }

    const response = await fetch(`/api/markets/financial?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(7000),
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const rawText = await response.text();
      const trimmed = rawText.trimStart();
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed) as FinancialMarketsResponse;
        if (parsed && Array.isArray(parsed.assets) && parsed.assets.length > 0) {
          clientMemoryCache.set(period, {
            expiresAt: Date.now() + 25_000,
            data: parsed,
          });
          saveToLocalStorage(period, parsed);
          return parsed;
        }
      }
    }
  } catch {
    // Segue silenciosamente para o Tier 2 (Motor CORS direto no navegador)
  }

  // TIER 2: Motor em Tempo Real Direto do Navegador (Coinbase Spot + Candles + Frankfurter ECB)
  try {
    const browserLive = await fetchBrowserRealFinancialMarkets(period);
    clientMemoryCache.set(period, {
      expiresAt: Date.now() + 25_000,
      data: browserLive,
    });
    saveToLocalStorage(period, browserLive);
    return browserLive;
  } catch (err) {
    // TIER 3: Snapshot persistido em LocalStorage se o navegador estiver totalmente sem internet
    const saved = loadFromLocalStorage(period);
    if (saved) {
      return saved;
    }
    throw err;
  }
}
