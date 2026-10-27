export type CepeaCategory = 
  | 'bovino' 
  | 'suino' 
  | 'frango' 
  | 'milho' 
  | 'soja' 
  | 'leite' 
  | 'cafe' 
  | 'cambio' 
  | 'algodao' 
  | 'acucar_etanol';

export type CepeaTrend = 'up' | 'down' | 'stable';

export interface CepeaCommodityQuote {
  id: string;
  code: string;
  name: string;
  category: CepeaCategory;
  price: number;
  unit: string;
  priceUsd?: number;
  changeDay: number; // % no dia (ex: +0.65)
  changeDayValue: number; // valor monetário de variação
  changeMonth: number; // % no mês acumulado
  changeYear?: number; // % no ano acumulado
  min30d: number;
  max30d: number;
  trend: CepeaTrend;
  frequency: 'Diária' | 'Semanal' | 'Mensal';
  source: string; // Ex: 'CEPEA/ESALQ - USP', 'CEPEA / B3 S.A.'
  marketPraca: string; // Ex: 'São Paulo', 'Santa Catarina', 'Minas Gerais', etc.
  paymentTerms: 'À Vista' | 'A Prazo 30d' | 'FOB' | 'CIF';
  icmsFunruralIncluded: boolean;
  lastSyncTimestamp: string;
  lastFormattedDate: string;
  officialEsalqLink?: string;
  description: string;
  zootecnicNotes?: string;
  isHeadline?: boolean; // Indicador de capa
}

export interface CepeaExchangeRatio {
  id: string;
  name: string;
  numeratorCommodity: string;
  denominatorCommodity: string;
  currentRatio: number;
  unit: string; // Ex: '@ de boi / bezerro', 'sacas de milho / @ boi', 'kg milho / kg suíno'
  historicalAvg: number;
  evaluation: 'FAVORÁVEL AO COMPRADOR' | 'EQUILIBRADO' | 'DESFAVORÁVEL';
  explanation: string;
  impactOnGapp: string;
  lastUpdated: string;
}

export interface CepeaSyncLog {
  id: string;
  timestamp: string;
  status: 'SUCESSO' | 'ALERTA' | 'OFFLINE';
  sourceUrl: string;
  latencyMs: number;
  recordsCount: number;
  message: string;
}

export interface CepeaHistoricalPoint {
  data: string;
  valorRs: number;
  varDia: number;
  varMes: number;
  valorUsd: number;
  carcassKg: number;
  movingAvg7?: number;
}

export interface CepeaSnapshot {
  lastUpdated: string;
  syncTimestamp: number;
  marketStatus: 'ABERTO' | 'FECHADO' | 'PRE-ABERTURA';
  syncStatus: 'SINCRONIZADO' | 'ATUALIZANDO' | 'ERRO';
  totalQuotes: number;
  quotes: CepeaCommodityQuote[];
  exchangeRatios: CepeaExchangeRatio[];
  syncHistory: CepeaSyncLog[];
  dolarPtax: number;
  historicoBoiGordo30d?: CepeaHistoricalPoint[];
  scrapedMeta?: {
    status: 'LIVE_SCRAPED' | 'CACHED_BENCHMARK';
    source: string;
    timestamp: string;
    latencyMs: number;
  };
}
