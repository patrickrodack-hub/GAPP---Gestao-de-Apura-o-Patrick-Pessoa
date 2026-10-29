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
