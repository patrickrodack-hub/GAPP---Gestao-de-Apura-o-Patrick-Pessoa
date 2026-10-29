export type PerishableCategoryId = 
  | 'corte_frango'
  | 'corte_carne_seca'
  | 'miudo_bovino'
  | 'suino_salgado'
  | 'charque_carne_seca'
  | 'queijo_mussarela_prato'
  | 'linguica_churrasco'
  | 'leite_uht_1l';

export interface PerishableCategoryDef {
  id: PerishableCategoryId;
  label: string;
  shortLabel: string;
  iconName: string;
  description: string;
  benchmarkBenchmark: string;
}

export interface RJSupermarketChain {
  id: string;
  code: string;
  name: string;
  shortName: string;
  profile: 'POPULAR' | 'ATACAREJO' | 'PREMIUM';
  regionFocus: string;
}

export type TvPromoMediaType = 
  | 'TV_GLOBO_RJ' 
  | 'TV_RECORD_RJ' 
  | 'TV_SBT_RJ' 
  | 'TABLOIDE_ENCARTE' 
  | 'ENCARTE_DOMINGO' 
  | 'APP_OFERTA';

export interface PerishableTvPromoOffer {
  hasActivePromo: boolean;
  promoPrice: number;            // Preço anunciado na TV / Encarte (R$)
  regularPrice?: number;         // Preço anterior de gôndola se citado no encarte
  chainName: string;             // Ex: 'Guanabara', 'Mundial', 'Supermarket', 'Assaí'
  chainId?: string;              // Ex: 'guanabara', 'mundial', etc.
  mediaType: TvPromoMediaType;   // Ex: 'TV_GLOBO_RJ'
  mediaLabel: string;            // Ex: 'Comercial TV Globo RJ'
  validity: string;              // Ex: 'Até 31/10', 'Válido até Domingo', 'Hoje Somente'
  highlightTag: string;          // Ex: 'OFERTA TV', 'IMBATÍVEL', 'TABLOIDE RJ', 'FIM DE SEMANA'
  adBroadcastTime?: string;      // Ex: 'Hoje, 20:42 • Intervalo JN / RJ2'
  auditSource: string;           // Ex: 'Clipping TV aberta RJ / Tabloide Guanabara Card'
  discountVsAvgPercent?: number; // Desconto % em relação à média das 12 redes
}

export interface PerishableProductItem {
  id: string;
  categoryId: PerishableCategoryId;
  productCode: string;
  name: string;
  specification: string;
  unit: string; // 'kg' | 'un' | 'pacote'
  standardPackKg: number;
  // Prices across 12 RJ supermarket chains (indexed by chain id)
  chainPrices: Record<string, number>;
  source: string;
  lastSurveyDate: string;
  // Rastreamento de Comercial de TV e Encartes de Oferta RJ
  promoOffer?: PerishableTvPromoOffer;
}

export interface PerishableProductCalculatedStats {
  productId: string;
  productName: string;
  minPrice: number;
  cheapestChain: string;
  maxPrice: number;
  priciestChain: string;
  avgPrice: number;
  spread: number;
  spreadPercent: number;
  validQuotesCount: number;
  promoOffer?: PerishableTvPromoOffer;
}

export interface CategorySummaryStats {
  categoryId: PerishableCategoryId;
  totalProducts: number;
  avgPriceCategory: number;
  minPriceCategory: number;
  cheapestChainOverall: string;
  maxPriceCategory: number;
  priciestChainOverall: string;
  avgSpread: number;
  lastUpdatedDate: string;
}

export interface PerishablesSnapshot {
  categories: PerishableCategoryDef[];
  products: PerishableProductItem[];
  chains: RJSupermarketChain[];
  lastUpdatedDate: string;
  lastSyncTimestamp: number;
  cacheTtlSeconds: number;
}
