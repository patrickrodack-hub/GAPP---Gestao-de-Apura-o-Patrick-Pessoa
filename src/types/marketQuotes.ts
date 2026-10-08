export type QuoteTrend = 'up' | 'down' | 'stable';

export interface MarketIndicator {
  id: string;
  code: string;
  name: string;
  category: 'bovino_gordo' | 'bovino_especial' | 'reposicao' | 'cambio' | 'carcaca' | 'varejo_rj' | 'suino';
  price: number;
  unit: string;
  changeDay: number; // Percentual diário (ex: +0.85%)
  changeDayValue: number; // Valor absoluto em R$
  changeWeek: number; // Percentual semanal
  changeMonth: number; // Percentual mensal
  trend: QuoteTrend;
  min30d: number;
  max30d: number;
  source: string; // Ex: 'CEPEA/ESALQ - USP', 'B3 Futuros', 'Scot Consultoria', 'IMEA', 'NielsenIQ RJ'
  lastUpdated: string;
  description: string;
  benchmarkPrice?: number; // Preço de referência
}

export interface RegionalQuote {
  id: string;
  state: string;
  stateCode: string;
  region: string;
  cashPriceArroba: number; // À vista (R$/@)
  termPriceArroba: number; // A prazo 30 dias (R$/@)
  liveWeightPriceKg: number; // Preço estimado do Kg vivo (R$/kg)
  carcassYieldEstimate: number; // Rendimento estimado de carcaça (%)
  cowCashPriceArroba: number; // Vaca gorda à vista (R$/@)
  heiferCashPriceArroba: number; // Novilha gorda à vista (R$/@)
  spreadVsSP: number; // Diferença em R$/@ em relação a São Paulo
  trend: QuoteTrend;
  slaughterScaleDays: number; // Escala média de abate em dias
  source: string;
  mainPackers: string; // Frigoríficos atuantes na praça (JBS, Marfrig, Minerva, etc.)
  lastUpdated: string;
}

export interface WholesaleCarcassQuote {
  id: string;
  name: string;
  type: 'casado' | 'traseiro' | 'dianteiro' | 'costela' | 'suino' | 'especial';
  priceKg: number; // Preço por kg atacado (R$/kg)
  equivalentArrobaPrice: number; // Equivalente por arroba
  changeWeek: number; // Variação semanal %
  trend: QuoteTrend;
  suggestedRetailPriceKg: number; // Sugestão no balcão de açougue
  rjRetailPriceKg: number; // Preço Médio Praticado no Varejo Supermercadista do RJ
  yieldPercentStandard: number; // % de participação na carcaça
  source: string;
  notes: string;
}

export interface WholesaleCutQuote {
  id: string;
  name: string;
  category: 'nobres' | 'traseiro' | 'dianteiro' | 'coxao' | 'alcatrao' | 'suino' | 'graxaria';
  productCode?: string; // Código correspondente no ERP (ex: COR-PICANHA, COR-CHA)
  minPriceKg: number; // Mínimo no Atacado/Frigorífico
  maxPriceKg: number; // Máximo no Atacado/Frigorífico
  avgPriceKg: number; // Custo Médio de Entrada (Atacado)
  changeWeek: number;
  trend: QuoteTrend;
  suggestedRetailPriceKg: number; // Sugestão Balcão GAPP
  rjRetailPriceKg: number; // Preço Médio Varejo Supermercados RJ (NielsenIQ / Scantec)
  rjRetailMarginPercent: number; // Margem Varejo RJ (%)
  scantecGiroRating: 'ALTO' | 'MÉDIO' | 'SELETIVO'; // Giro Sell-Out Scantec RJ
  nielsenSharePercent: number; // Share de Vendas no Açougue NielsenIQ RJ (%)
  idealMarginPercent: number; // Margem Alvo no Balcão (%)
  standardYieldPercent: number; // Rendimento Zootécnico na Carcaça (%)
  source: string; // Fontes (CEPEA, Scot, NielsenIQ, Scantec, JBS, Marfrig, Minerva)
  packers: string; // Principais frigoríficos ofertantes
  description: string;
}

export interface RJRetailBenchmark {
  id: string;
  chainName: string; // Ex: Guanabara, Mundial, Prezunic, Supermarket, Zona Sul, Assaí RJ
  category: 'atacarejo' | 'supermercado_popular' | 'supermercado_premium';
  sampleCutPrices: {
    picanha: number;
    contraFile: number;
    alcatra: number;
    coxaoMole: number;
    patinho: number;
    acem: number;
    costela: number;
    pernilSuino: number;
  };
  lastSurveyDate: string;
  source: string;
}

export interface HistoricalPricePoint {
  date: string;
  formattedDate: string;
  cepeaB3Price: number;
  boiChinaPrice: number;
  vacaPrice: number;
  traseiroPriceKg: number;
  dianteiroPriceKg: number;
  gappAveragePrice?: number;
  rjVarejoAverageKg?: number;
}

export interface MarketQuotesSnapshot {
  timestamp: number;
  lastUpdatedDate: string;
  marketStatus: 'ABERTO' | 'FECHADO' | 'PRE-ABERTURA';
  indicators: MarketIndicator[];
  regionalQuotes: RegionalQuote[];
  carcassQuotes: WholesaleCarcassQuote[];
  cutQuotes: WholesaleCutQuote[];
  rjRetailBenchmarks: RJRetailBenchmark[];
  historicalSeries: HistoricalPricePoint[];
}
