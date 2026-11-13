import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  Euro,
  Gem,
  Bitcoin,
  Calendar,
  Activity,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import {
  FINANCIAL_PERIOD_OPTIONS,
  FinancialAssetId,
  FinancialAssetQuote,
  FinancialHistoryPoint,
  FinancialMarketsResponse,
  FinancialPeriod,
  fetchFinancialMarkets,
} from '../../services/financialMarketsService';

function formatAssetValueBrl(assetId: FinancialAssetId, value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (assetId === 'USD' || assetId === 'EUR') {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  if (assetId === 'BTC') {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsdValue(assetId: FinancialAssetId, value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return '';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: assetId === 'BTC' ? 0 : 2,
    maximumFractionDigits: assetId === 'BTC' ? 0 : 2,
  });
}

function formatAxisTickBrl(assetId: FinancialAssetId, value: number): string {
  if (!Number.isFinite(value)) return '';
  if (assetId === 'USD' || assetId === 'EUR') {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
  if (assetId === 'BTC') {
    if (value >= 1000) {
      return `R$ ${Math.round(value / 1000)}k`;
    }
    return `R$ ${Math.round(value)}`;
  }
  return `R$ ${value.toFixed(0)}`;
}

function getAssetIcon(assetId: FinancialAssetId) {
  switch (assetId) {
    case 'USD':
      return DollarSign;
    case 'EUR':
      return Euro;
    case 'GOLD':
      return Gem;
    case 'BTC':
      return Bitcoin;
  }
}

interface MiniSparklineProps {
  points: FinancialHistoryPoint[];
  isPositive: boolean;
  isSelected: boolean;
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({ points, isPositive, isSelected }) => {
  if (!points || points.length < 2) {
    return <div className="h-8 w-20" />;
  }

  const width = 84;
  const height = 28;
  const values = points.map(p => p.valueBrl);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - ((val - min) / span) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const strokeColor = isSelected
    ? isPositive
      ? '#b5e550'
      : '#fda4af'
    : isPositive
    ? '#059669'
    : '#e11d48';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  );
};

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FinancialHistoryPoint & { deltaPercent?: number } }>;
  asset: FinancialAssetQuote;
}

const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({ active, payload, asset }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  const delta = point.deltaPercent ?? 0;
  const isUp = delta >= 0;

  return (
    <div className="bg-[#113829] text-white px-3.5 py-2.5 rounded-2xl shadow-xl border border-[#245943] text-xs min-w-[190px]">
      <div className="flex items-center justify-between gap-3 text-[10px] text-emerald-200/80 font-semibold uppercase tracking-wider mb-1">
        <span>{asset.ticker}</span>
        <span className="font-mono">{point.fullDate}</span>
      </div>
      <div className="text-base font-black font-mono tabular-nums text-white">
        {formatAssetValueBrl(asset.id, point.valueBrl)}
      </div>
      {point.valueUsd !== undefined && (asset.id === 'GOLD' || asset.id === 'BTC') && (
        <div className="text-[11px] font-mono text-emerald-100/80 tabular-nums mt-0.5">
          {formatUsdValue(asset.id, point.valueUsd)}{' '}
          <span className="text-[10px] text-emerald-200/60">
            ({asset.id === 'GOLD' ? 'USD/oz' : 'USD'})
          </span>
        </div>
      )}
      <div
        className={`mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between font-mono text-[11px] font-bold ${
          isUp ? 'text-[#b5e550]' : 'text-rose-300'
        }`}
      >
        <span>Var. no período</span>
        <span>
          {isUp ? '+' : ''}
          {delta.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export const FinancialMarketsTickerCard: React.FC = () => {
  const [period, setPeriod] = useState<FinancialPeriod>('1mo');
  const [selectedAssetId, setSelectedAssetId] = useState<FinancialAssetId>('USD');
  const [data, setData] = useState<FinancialMarketsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Filtro opcional por intervalo de datas dentro do período carregado
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);

  const loadMarkets = useCallback(
    async (targetPeriod: FinancialPeriod, forceFresh = false, silent = false) => {
      try {
        if (!silent) {
          setRefreshing(true);
          if (!data) setLoading(true);
        }
        setError(null);
        const res = await fetchFinancialMarkets(targetPeriod, forceFresh);
        setData(res);
      } catch (err: any) {
        const rawMsg = String(err?.message || '');
        const cleanMsg =
          rawMsg.includes('Unexpected token') || rawMsg.includes('<!doctype')
            ? 'Sincronizando com o gateway de cotações em tempo real. Clique em Tentar novamente.'
            : rawMsg || 'Não foi possível conectar às fontes financeiras em tempo real.';
        setError(cleanMsg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [data]
  );

  useEffect(() => {
    loadMarkets(period, false, false);
    // Limpa filtro customizado de datas ao trocar de período macro
    setStartDateFilter('');
    setEndDateFilter('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Polling em tempo real a cada 30s
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = window.setInterval(() => {
      loadMarkets(period, true, true);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, period, loadMarkets]);

  const activeAsset: FinancialAssetQuote | undefined = useMemo(() => {
    if (!data?.assets?.length) return undefined;
    return data.assets.find(a => a.id === selectedAssetId) || data.assets[0];
  }, [data, selectedAssetId]);

  // Aplica filtro de data customizada (se preenchido) e calcula métricas do intervalo exibido
  const filteredChartInfo = useMemo(() => {
    if (!activeAsset) {
      return {
        points: [] as Array<FinancialHistoryPoint & { deltaPercent: number }>,
        open: 0,
        high: 0,
        low: 0,
        last: 0,
        changeAbs: 0,
        changePct: 0,
      };
    }

    let rawPoints = activeAsset.history;
    if (startDateFilter) {
      rawPoints = rawPoints.filter(p => p.isoDate >= startDateFilter);
    }
    if (endDateFilter) {
      rawPoints = rawPoints.filter(p => p.isoDate <= endDateFilter);
    }

    // Fallback se filtro ficou vazio
    const effective = rawPoints.length > 0 ? rawPoints : activeAsset.history;
    const open = effective[0]?.valueBrl ?? activeAsset.priceBrl;
    const last =
      !endDateFilter && effective === activeAsset.history
        ? activeAsset.priceBrl
        : effective[effective.length - 1]?.valueBrl ?? activeAsset.priceBrl;

    let high = effective[0]?.valueBrl ?? 0;
    let low = effective[0]?.valueBrl ?? 0;
    const points = effective.map(pt => {
      if (pt.valueBrl > high) high = pt.valueBrl;
      if (pt.valueBrl < low) low = pt.valueBrl;
      const deltaPercent = open > 0 ? ((pt.valueBrl - open) / open) * 100 : 0;
      return {
        ...pt,
        deltaPercent,
      };
    });

    if (!endDateFilter && effective === activeAsset.history) {
      if (activeAsset.priceBrl > high) high = activeAsset.priceBrl;
      if (activeAsset.priceBrl < low) low = activeAsset.priceBrl;
    }

    const changeAbs = last - open;
    const changePct = open > 0 ? (changeAbs / open) * 100 : 0;

    return {
      points,
      open,
      high,
      low,
      last,
      changeAbs,
      changePct,
    };
  }, [activeAsset, startDateFilter, endDateFilter]);

  const isPeriodPositive = filteredChartInfo.changePct >= 0;
  const chartColor = isPeriodPositive ? '#059669' : '#e11d48';
  const hasDateSubFilter = Boolean(startDateFilter || endDateFilter);

  const availableMinDate = activeAsset?.history[0]?.isoDate || '';
  const availableMaxDate = activeAsset?.history[activeAsset.history.length - 1]?.isoDate || '';

  return (
    <div className="bg-white border border-[#e4e9e5] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* ===================================================================== */}
      {/* HEADER: BOLSA DE VALORES & CÂMBIO EM TEMPO REAL                      */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#113829] text-[#b5e550] flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Terminal Bolsa & Câmbio em Tempo Real
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PREGÃO AO VIVO
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dólar Comercial, Euro, Ouro 24k (COMEX) e Bitcoin Spot com histórico interativo da bolsa
            </p>
          </div>
        </div>

        {/* Status de Atualização + Controles */}
        <div className="flex flex-wrap items-center gap-2">
          {data && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f6f4] text-[11px] font-semibold text-slate-600">
              <Clock className="w-3.5 h-3.5 text-[#113829]" />
              <span className="font-mono">{data.fetchedAtFormatted}</span>
              <span className="text-slate-400">• {data.latencyMs}ms</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAutoRefreshEnabled(prev => !prev)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
              autoRefreshEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title="Atualização automática a cada 30 segundos"
          >
            Auto 30s: {autoRefreshEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => loadMarkets(period, true, false)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#113829] hover:bg-[#184a36] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Sincronizando...' : 'Atualizar Pregão'}</span>
          </button>
        </div>
      </div>

      {/* Erro amigável se houver falha de rede */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadMarkets(period, true, false)}
            className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-[11px] cursor-pointer shrink-0"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4 TICKER CARDS ESTILO BOLSA DE VALORES (CLICÁVEIS)                   */}
      {/* ===================================================================== */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/70"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {(data?.assets || []).map(asset => {
            const isSelected = asset.id === activeAsset?.id;
            const isUp24h = asset.changePercent24h >= 0;
            const Icon = getAssetIcon(asset.id);

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAssetId(asset.id)}
                className={`text-left rounded-2xl p-4 transition-all cursor-pointer border relative overflow-hidden flex flex-col justify-between min-h-[136px] ${
                  isSelected
                    ? 'bg-[#113829] text-white border-[#113829] shadow-md ring-2 ring-[#b5e550]/60'
                    : 'bg-[#f8faf8] hover:bg-[#f1f5f2] text-slate-900 border-[#e4e9e5]'
                }`}
              >
                {/* Top row: Icon + Ticker + % Pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#b5e550] text-[#113829]'
                          : 'bg-white border border-slate-200 text-[#113829]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold tracking-tight truncate">
                          {asset.name}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-mono font-bold ${
                          isSelected ? 'text-emerald-200/80' : 'text-slate-400'
                        }`}
                      >
                        {asset.ticker}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-extrabold shrink-0 ${
                      isSelected
                        ? isUp24h
                          ? 'bg-[#b5e550]/20 text-[#b5e550]'
                          : 'bg-rose-500/25 text-rose-200'
                        : isUp24h
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isUp24h ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isUp24h ? '+' : ''}
                    {asset.changePercent24h.toFixed(2)}%
                  </span>
                </div>

                {/* Middle/Bottom: Live Price + Mini Sparkline */}
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xl font-black font-mono tabular-nums tracking-tight leading-none">
                      {formatAssetValueBrl(asset.id, asset.priceBrl)}
                    </div>
                    <div
                      className={`text-[10px] font-mono mt-1.5 truncate ${
                        isSelected ? 'text-emerald-100/80' : 'text-slate-500'
                      }`}
                    >
                      {asset.secondaryPriceUsd !== undefined &&
                      (asset.id === 'GOLD' || asset.id === 'BTC') ? (
                        <span>
                          {formatUsdValue(asset.id, asset.secondaryPriceUsd)}{' '}
                          {asset.id === 'GOLD' ? '/ oz' : 'USD'}
                        </span>
                      ) : (
                        <span>{asset.unitLabel}</span>
                      )}
                    </div>
                  </div>

                  <MiniSparkline
                    points={asset.history}
                    isPositive={asset.periodChangePercent >= 0}
                    isSelected={isSelected}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ÁREA DO GRÁFICO HISTÓRICO DE LINHA COM FILTROS DE PERÍODO             */}
      {/* ===================================================================== */}
      {activeAsset && (
        <div className="rounded-2xl border border-[#e4e9e5] bg-[#fafcfa] p-4 sm:p-5 space-y-4">
          {/* Chart Top Bar: Active Asset Headline + Period Pills + Custom Date Filter Toggle */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#113829] text-[#b5e550] text-[10px] font-mono font-extrabold">
                  {activeAsset.ticker}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Histórico de Cotação — {activeAsset.name}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  ({activeAsset.source})
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
                <span className="text-2xl font-black font-mono tabular-nums text-slate-900">
                  {formatAssetValueBrl(activeAsset.id, filteredChartInfo.last)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-mono font-extrabold ${
                    isPeriodPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {isPeriodPositive ? '+' : ''}
                  {filteredChartInfo.changePct.toFixed(2)}% (
                  {isPeriodPositive ? '+' : ''}
                  {formatAssetValueBrl(activeAsset.id, filteredChartInfo.changeAbs)})
                </span>
                <span className="text-[11px] text-slate-400">
                  no intervalo selecionado
                </span>
              </div>
            </div>

            {/* Filtros de Período da Bolsa + Filtro de Data Customizado */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-full shadow-2xs">
                {FINANCIAL_PERIOD_OPTIONS.map(opt => {
                  const active = period === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPeriod(opt.id)}
                      title={opt.description}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
                        active
                          ? 'bg-[#113829] text-[#b5e550] shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {opt.shortLabel}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowDateFilter(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  showDateFilter || hasDateSubFilter
                    ? 'bg-[#113829] text-white border-[#113829]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar Datas</span>
                {hasDateSubFilter && (
                  <span className="w-2 h-2 rounded-full bg-[#b5e550]" />
                )}
              </button>
            </div>
          </div>

          {/* Barra Expandível de Filtro de Datas Dentro do Período */}
          {(showDateFilter || hasDateSubFilter) && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#113829]" />
                <span>Recorte no período:</span>
              </div>

              <label className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span>De:</span>
                <input
                  type="date"
                  value={startDateFilter}
                  min={availableMinDate}
                  max={endDateFilter || availableMaxDate}
                  onChange={e => setStartDateFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#113829]/20"
                />
              </label>

              <label className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span>Até:</span>
                <input
                  type="date"
                  value={endDateFilter}
                  min={startDateFilter || availableMinDate}
                  max={availableMaxDate}
                  onChange={e => setEndDateFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#113829]/20"
                />
              </label>

              {hasDateSubFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Limpar datas
                </button>
              )}

              <span className="ml-auto text-[11px] text-slate-400 font-mono">
                {filteredChartInfo.points.length} pontos exibidos
              </span>
            </div>
          )}

          {/* Gráfico Recharts de Linha/Área Estilo Bolsa de Valores */}
          <div className="h-[260px] sm:h-[290px] w-full bg-white rounded-2xl border border-slate-100 p-3 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredChartInfo.points}
                margin={{ top: 10, right: 12, left: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient id={`bolsaGradient-${activeAsset.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  minTickGap={26}
                />

                <YAxis
                  orientation="right"
                  domain={['auto', 'auto']}
                  tickFormatter={val => formatAxisTickBrl(activeAsset.id, Number(val))}
                  tick={{ fontSize: 11, fill: '#475569', fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  width={76}
                />

                <Tooltip
                  content={<CustomChartTooltip asset={activeAsset} />}
                  cursor={{ stroke: '#113829', strokeWidth: 1, strokeDasharray: '4 4' }}
                />

                <ReferenceLine
                  y={filteredChartInfo.open}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                />

                <Area
                  type="monotone"
                  dataKey="valueBrl"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill={`url(#bolsaGradient-${activeAsset.id})`}
                  activeDot={{
                    r: 5,
                    fill: '#113829',
                    stroke: '#b5e550',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Barra de Resumo do Pregão (Abertura, Mínima, Máxima, Atual, Pontos) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-white rounded-2xl border border-slate-100 px-3.5 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Abertura Período
              </div>
              <div className="text-sm font-extrabold font-mono text-slate-800 tabular-nums mt-0.5">
                {formatAssetValueBrl(activeAsset.id, filteredChartInfo.open)}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 px-3.5 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                Mínima Período
              </div>
              <div className="text-sm font-extrabold font-mono text-rose-700 tabular-nums mt-0.5">
                {formatAssetValueBrl(activeAsset.id, filteredChartInfo.low)}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 px-3.5 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Máxima Período
              </div>
              <div className="text-sm font-extrabold font-mono text-emerald-700 tabular-nums mt-0.5">
                {formatAssetValueBrl(activeAsset.id, filteredChartInfo.high)}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 px-3.5 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fechamento / Atual
              </div>
              <div className="text-sm font-extrabold font-mono text-slate-900 tabular-nums mt-0.5">
                {formatAssetValueBrl(activeAsset.id, filteredChartInfo.last)}
              </div>
            </div>

            <div className="bg-[#113829] rounded-2xl px-3.5 py-2.5 col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80">
                Status / Fonte
              </div>
              <div className="text-xs font-extrabold text-[#b5e550] mt-0.5 truncate">
                {activeAsset.marketStatus}
              </div>
              <div className="text-[10px] text-emerald-100/70 font-mono truncate">
                {activeAsset.updatedAtFormatted}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
