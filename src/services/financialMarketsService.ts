/**
 * Tipos e Cliente API para Cotações Financeiras em Tempo Real (Estilo Bolsa de Valores)
 * Ativos: Dólar Comercial (USD/BRL), Euro Comercial (EUR/BRL), Ouro 24k (XAU/BRL g + US$/oz) e Bitcoin (BTC/BRL + US$)
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

export async function fetchFinancialMarkets(
  period: FinancialPeriod,
  forceFresh = false
): Promise<FinancialMarketsResponse> {
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
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Falha ao buscar cotações financeiras (${response.status}): ${errText}`);
  }

  return response.json() as Promise<FinancialMarketsResponse>;
}
