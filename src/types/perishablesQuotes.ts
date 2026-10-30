export type PerishableCategoryId = 
  | 'corte_frango'
  | 'corte_carne_seca'
  | 'miudo_bovino'
  | 'suino_salgado'
  | 'charque_carne_seca'
  | 'queijo_mussarela_prato'
  | 'linguica_churrasco'
  | 'leite_uht_1l'
  | 'corte_carne_bov'
  | 'corte_carne_suina'
  | 'hortifruti_flv';

export type FlvSubdivision = 'FRUTAS' | 'LEGUMES' | 'OVOS' | 'ALHO' | 'HORTALIÇAS';

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
  | 'CLUBE_FIDELIDADE'
  | 'LAMINA_OFERTA'
  | 'REDE_SOCIAL'
  | 'APP_OFERTA';

export type PromoChannelType = 'TV' | 'ENCARTE' | 'CLUBE' | 'LAMINA' | 'REDES';

export interface PerishableTvPromoOffer {
  hasActivePromo: boolean;
  promoPrice: number;            // Preço anunciado na TV / Encarte / Clube / Lâmina / Redes (R$)
  regularPrice?: number;         // Preço anterior de gôndola se citado no anúncio
  chainName: string;             // Ex: 'Supermercados Guanabara', 'Supermercados Mundial', 'Assaí Atacadista RJ'
  chainId?: string;              // Ex: 'guanabara', 'mundial', 'assai', etc.
  mediaType: TvPromoMediaType;   // Tipo detalhado da mídia
  mediaChannel?: PromoChannelType; // Canal principal ('TV', 'ENCARTE', 'CLUBE', 'LAMINA', 'REDES')
  mediaLabel: string;            // Ex: 'Comercial TV Globo RJ (Horário Nobre)', 'Clube Guanabara Card', 'Lâmina Semanal Supermarket'
  validity: string;              // Ex: '28/10 a 03/11/2026', 'Quarta e Quinta do Horti', 'Válido até Domingo'
  highlightTag: string;          // Ex: 'OFERTA TV GLOBO', 'CLUBE EXCLUSIVO', 'LÂMINA EXPRESS', 'REDE SOCIAL'
  adBroadcastTime?: string;      // Ex: 'Hoje, 20:45 • Intervalo Jornal Nacional', 'Post Instagram @supermercadosguanabara'
  auditSource: string;           // Ex: 'Clipping TV aberta RJ / Tabloide Guanabara Card'
  conditionNotes?: string;       // Ex: 'Preço exclusivo para clientes Clube com CPF cadastrado', 'Limite de 5kg por cliente'
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
  // Subdivisão dinâmica do setor HORTFRUT / FLV (Frutas, Legumes, Ovos, Alho, Hortaliças)
  flvSubdivision?: FlvSubdivision;
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

export interface PriceDiscrepancyItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryId: PerishableCategoryId;
  flvSubdivision?: FlvSubdivision;
  chainId: string;
  chainName: string;
  announcedPrice: number;
  processedPrice: number;
  diffValue: number;
  diffPercent: number;
  mediaChannel: PromoChannelType;
  mediaLabel: string;
  validity: string;
  adBroadcastTime: string;
  auditSource: string;
  severity: 'CRITICAL' | 'WARNING';
  timestamp: string;
  resolved: boolean;
}

export interface PerishablesAuditReport {
  timestamp: string;
  latencyMs: number;
  status: 'AUDITED_CONFORMANT' | 'DISCREPANCIES_FOUND';
  totalProductsAudited: number;
  promosAudited: number;
  parityCount: number;
  discrepancyCount: number;
  integrityScore: number; // 0 a 100%
  discrepancies: PriceDiscrepancyItem[];
  auditHash: string;
  verifiedSources: string[];
}

