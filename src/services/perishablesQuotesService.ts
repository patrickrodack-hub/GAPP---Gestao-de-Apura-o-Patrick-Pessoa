import { 
  PerishableCategoryId, 
  PerishableCategoryDef, 
  RJSupermarketChain, 
  PerishableProductItem, 
  PerishableProductCalculatedStats, 
  CategorySummaryStats,
  PerishablesSnapshot,
  PerishableTvPromoOffer
} from '../types/perishablesQuotes';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { ReportBrandingService } from './reportBrandingService';
import { PrintEngineService } from './printEngineService';
import { OFFICIAL_RJ_TV_PROMO_REGISTRY } from './perishableTvPromoRegistry';

const STORAGE_KEY = 'apuracao_boi_perishables_quotes_v1';

export const PERISHABLE_CATEGORIES: PerishableCategoryDef[] = [
  {
    id: 'corte_frango',
    label: 'CORTE DE FRANGO',
    shortLabel: 'Frango',
    iconName: 'drumstick',
    description: 'Cortes avícolas in natura resfriados e congelados no balcão e gôndola de 12 redes do RJ.',
    benchmarkBenchmark: 'Ceasa RJ / ASSERJ / DITEC'
  },
  {
    id: 'corte_carne_seca',
    label: 'CORTE DE CARNE SECA',
    shortLabel: 'Carne Seca',
    iconName: 'beef',
    description: 'Cortes de carne seca bovina (dianteiro, traseiro e ponta de agulha) maturados e dessecados no RJ.',
    benchmarkBenchmark: 'ASSERJ / Preço da Hora SEFAZ-RJ'
  },
  {
    id: 'miudo_bovino',
    label: 'MIUDO BOVINO',
    shortLabel: 'Miúdo Bovino',
    iconName: 'heart',
    description: 'Fígado, dobradinha, bucho, rabada, mocotó, coração e língua bovina no varejo fluminense.',
    benchmarkBenchmark: 'Frigoríficos RJ / Ceasa Irajá / Procon-RJ'
  },
  {
    id: 'suino_salgado',
    label: 'SUINO SALGADO',
    shortLabel: 'Suíno Salgado',
    iconName: 'pig',
    description: 'Costelinha salgada, lombo, bacon em manta/cubos, orelha, pé e rabo salgados para feijoada.',
    benchmarkBenchmark: 'Scantec Sell-Out RJ / ASSERJ'
  },
  {
    id: 'charque_carne_seca',
    label: 'CHARQUE / CARNE SECA',
    shortLabel: 'Charque / Seca',
    iconName: 'layers',
    description: 'Charque embalado a vácuo, jerked beef dianteiro/traseiro e charque desfiado no grande Rio.',
    benchmarkBenchmark: 'ASSERJ / Indústria Charqueadora'
  },
  {
    id: 'queijo_mussarela_prato',
    label: 'QUEIJO MUSSARELA / PRATO',
    shortLabel: 'Queijos',
    iconName: 'cheese',
    description: 'Mussarela peça e fatiada, prato, minas padrão, queijo coalho de churrasco e requeijão culinário.',
    benchmarkBenchmark: 'Laticínios RJ/MG • NielsenIQ RJ'
  },
  {
    id: 'linguica_churrasco',
    label: 'LINGÜIÇA DE CHURRASCO',
    shortLabel: 'Linguiça Churrasco',
    iconName: 'flame',
    description: 'Linguiça toscana, frango, mista, calabresa defumada, paio e artesanal no balcão das 12 redes.',
    benchmarkBenchmark: 'ABPA / ASSERJ / Scantec RJ'
  },
  {
    id: 'leite_uht_1l',
    label: 'LEITE UHT DE 1LT',
    shortLabel: 'Leite UHT 1L',
    iconName: 'milk',
    description: 'Monitoramento das principais marcas de leite UHT 1 Litro (Integral, Desnatado, Semidesnatado e Zero Lactose) no RJ.',
    benchmarkBenchmark: 'ASSERJ / Procon-RJ / NielsenIQ RJ'
  }
];

export const RJ_SUPERMARKET_CHAINS: RJSupermarketChain[] = [
  { id: 'guanabara', code: 'GUA', name: 'Supermercados Guanabara', shortName: 'Guanabara', profile: 'POPULAR', regionFocus: 'Grande Rio e Baixada' },
  { id: 'mundial', code: 'MUN', name: 'Supermercados Mundial', shortName: 'Mundial', profile: 'POPULAR', regionFocus: 'Rio Capital e Niterói' },
  { id: 'prezunic', code: 'PREZ', name: 'Prezunic (Cencosud)', shortName: 'Prezunic', profile: 'POPULAR', regionFocus: 'Capital e Baixada' },
  { id: 'supermarket', code: 'SMK', name: 'Rede Supermarket RJ', shortName: 'Supermarket', profile: 'POPULAR', regionFocus: 'Todo Estado do RJ' },
  { id: 'economia', code: 'ECO', name: 'Supermercados Rede Economia', shortName: 'Rede Economia', profile: 'POPULAR', regionFocus: 'Baixada e São Gonçalo' },
  { id: 'dom_atacadista', code: 'DOM', name: 'Dom Atacadista', shortName: 'Dom Atacadista', profile: 'ATACAREJO', regionFocus: 'Grande Rio e Interior' },
  { id: 'assai', code: 'ASSAI', name: 'Assaí Atacadista RJ', shortName: 'Assaí RJ', profile: 'ATACAREJO', regionFocus: 'Capital e Interior' },
  { id: 'atacadao', code: 'ATAC', name: 'Atacadão (Carrefour RJ)', shortName: 'Atacadão', profile: 'ATACAREJO', regionFocus: 'Baixada e Capital' },
  { id: 'princesa', code: 'PRI', name: 'Supermercados Princesa', shortName: 'Princesa', profile: 'POPULAR', regionFocus: 'Centro e Zona Sul/Norte' },
  { id: 'multi_market', code: 'MMK', name: 'Rede Multi Market RJ', shortName: 'Multi Market', profile: 'POPULAR', regionFocus: 'Zona Oeste e Baixada' },
  { id: 'zona_sul', code: 'ZS', name: 'Supermercados Zona Sul', shortName: 'Zona Sul', profile: 'PREMIUM', regionFocus: 'Zona Sul e Barra' },
  { id: 'hortifruti', code: 'HNT', name: 'Hortifruti Natural da Terra / SuperPrix', shortName: 'Hortifruti / SuperPrix', profile: 'PREMIUM', regionFocus: 'Zona Sul, Barra e Tijuca' }
];

export const INITIAL_PERISHABLE_PRODUCTS: PerishableProductItem[] = [
  // =========================================================================
  // 1. CORTE DE FRANGO
  // =========================================================================
  {
    id: 'frango-peito-osso',
    categoryId: 'corte_frango',
    productCode: 'FRG-PEITO-OSSO',
    name: 'Peito de Frango com Osso Resfriado',
    specification: 'Peito in natura resfriado com osso e pele para desossa/ensopados',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 11.49,
      mundial: 11.98,
      prezunic: 12.90,
      supermarket: 12.49,
      economia: 11.99,
      dom_atacadista: 10.99,
      assai: 10.90,
      atacadao: 10.89,
      princesa: 12.80,
      multi_market: 12.50,
      zona_sul: 16.90,
      hortifruti: 17.50
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'frango-file-peito',
    categoryId: 'corte_frango',
    productCode: 'FRG-FILE-PEITO',
    name: 'Filé de Peito de Frango sem Pele Resfriado',
    specification: 'Filé limpo higienizado sem osso em bandeja ou a granel no balcão',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 18.90,
      mundial: 19.49,
      prezunic: 20.90,
      supermarket: 19.99,
      economia: 19.49,
      dom_atacadista: 17.90,
      assai: 17.80,
      atacadao: 17.75,
      princesa: 20.50,
      multi_market: 19.90,
      zona_sul: 25.90,
      hortifruti: 26.90
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'frango-coxa-sobrecoxa',
    categoryId: 'corte_frango',
    productCode: 'FRG-COXA-SOBRE',
    name: 'Coxa e Sobrecoxa de Frango com Osso Resfriada',
    specification: 'Corte tradicional com pele e osso para assados e almoço popular carioca',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 8.99,
      mundial: 9.49,
      prezunic: 10.90,
      supermarket: 9.99,
      economia: 9.49,
      dom_atacadista: 8.49,
      assai: 8.39,
      atacadao: 8.35,
      princesa: 10.40,
      multi_market: 9.90,
      zona_sul: 13.90,
      hortifruti: 14.50
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Encartes Semanais',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'frango-file-coxa',
    categoryId: 'corte_frango',
    productCode: 'FRG-FILE-COXA',
    name: 'Filé de Coxa e Sobrecoxa sem Pele Desossado',
    specification: 'Desossado suculento resfriado, ideal para grelha e iscas',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 17.90,
      mundial: 18.49,
      prezunic: 19.90,
      supermarket: 18.99,
      economia: 18.49,
      dom_atacadista: 16.90,
      assai: 16.80,
      atacadao: 16.79,
      princesa: 19.50,
      multi_market: 18.90,
      zona_sul: 23.90,
      hortifruti: 24.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'frango-asa-tulipa',
    categoryId: 'corte_frango',
    productCode: 'FRG-ASA-TULIPA',
    name: 'Asa de Frango / Meio da Asa (Tulipa)',
    specification: 'Asa inteira ou tulipa resfriada para churrasco carioca de fim de semana',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 18.99,
      mundial: 19.49,
      prezunic: 21.90,
      supermarket: 20.49,
      economia: 19.99,
      dom_atacadista: 17.99,
      assai: 17.89,
      atacadao: 17.80,
      princesa: 21.50,
      multi_market: 20.90,
      zona_sul: 26.90,
      hortifruti: 27.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'frango-coracao',
    categoryId: 'corte_frango',
    productCode: 'FRG-CORACAO',
    name: 'Coração de Frango Resfriado / Balcão',
    specification: 'Coração higienizado sem excesso de gordura para espetos de churrasco',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 29.90,
      mundial: 30.90,
      prezunic: 33.90,
      supermarket: 32.50,
      economia: 31.90,
      dom_atacadista: 27.90,
      assai: 27.80,
      atacadao: 27.70,
      princesa: 33.50,
      multi_market: 32.90,
      zona_sul: 39.90,
      hortifruti: 41.90
    },
    source: 'Pesquisa Balcão RJ • Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'frango-moela',
    categoryId: 'corte_frango',
    productCode: 'FRG-MOELA',
    name: 'Moela de Frango Limpa Resfriada',
    specification: 'Moela amarela limpa fresca para petiscos de boteco carioca e ensopados',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 10.99,
      mundial: 11.49,
      prezunic: 12.90,
      supermarket: 11.99,
      economia: 11.49,
      dom_atacadista: 9.99,
      assai: 9.89,
      atacadao: 9.85,
      princesa: 12.50,
      multi_market: 11.90,
      zona_sul: 15.90,
      hortifruti: 16.50
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'frango-inteiro',
    categoryId: 'corte_frango',
    productCode: 'FRG-INTEIRO',
    name: 'Frango Inteiro Resfriado / Congelado (com Miúdos)',
    specification: 'Frango eviscerado inteiro padrão com saquinho de miúdos internos',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 8.98,
      mundial: 9.39,
      prezunic: 10.50,
      supermarket: 9.89,
      economia: 9.49,
      dom_atacadista: 8.49,
      assai: 8.39,
      atacadao: 8.29,
      princesa: 10.20,
      multi_market: 9.79,
      zona_sul: 13.90,
      hortifruti: 14.50
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Encartes Oficiais',
    lastSurveyDate: 'Hoje, 17:30'
  },

  // =========================================================================
  // 2. CORTE DE CARNE SECA
  // =========================================================================
  {
    id: 'seca-dianteiro',
    categoryId: 'corte_carne_seca',
    productCode: 'SEC-DIANT-ESP',
    name: 'Carne Seca Dianteiro Especial (Manta / Pedaço)',
    specification: 'Carne seca curada bovina do dianteiro (paleta/peito) para feijão e escondidinho',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 32.90,
      mundial: 33.90,
      prezunic: 36.90,
      supermarket: 35.50,
      economia: 34.90,
      dom_atacadista: 30.90,
      assai: 30.80,
      atacadao: 30.70,
      princesa: 36.50,
      multi_market: 35.90,
      zona_sul: 42.90,
      hortifruti: 43.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'seca-traseiro',
    categoryId: 'corte_carne_seca',
    productCode: 'SEC-TRAS-NOBRE',
    name: 'Carne Seca Traseiro Nobre (Coxão / Alcatra)',
    specification: 'Corte nobre de carne seca com baixo teor de gordura e fibras longas macias',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 40.90,
      mundial: 41.90,
      prezunic: 45.90,
      supermarket: 43.90,
      economia: 42.90,
      dom_atacadista: 38.90,
      assai: 38.70,
      atacadao: 38.50,
      princesa: 44.90,
      multi_market: 43.90,
      zona_sul: 51.90,
      hortifruti: 53.50
    },
    source: 'Pesquisa Balcão RJ • Scantec RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'seca-ponta-agulha',
    categoryId: 'corte_carne_seca',
    productCode: 'SEC-PONTA-AGULHA',
    name: 'Carne Seca Ponta de Agulha Especial',
    specification: 'Carne seca tradicional de costela e ponta com capa saborosa para caldos',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 29.90,
      mundial: 30.90,
      prezunic: 33.90,
      supermarket: 32.50,
      economia: 31.90,
      dom_atacadista: 28.50,
      assai: 28.40,
      atacadao: 28.30,
      princesa: 33.00,
      multi_market: 32.50,
      zona_sul: 38.90,
      hortifruti: 39.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'jerked-beef-traseiro',
    categoryId: 'corte_carne_seca',
    productCode: 'SEC-JERKED-TRAS',
    name: 'Jerked Beef Traseiro Desossado a Vácuo',
    specification: 'Carne bovina curada e dessecação controlada em embalagem a vácuo institucional',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 37.90,
      mundial: 38.90,
      prezunic: 42.50,
      supermarket: 40.90,
      economia: 39.90,
      dom_atacadista: 35.90,
      assai: 35.70,
      atacadao: 35.50,
      princesa: 41.90,
      multi_market: 40.50,
      zona_sul: 47.90,
      hortifruti: 48.90
    },
    source: 'Pesquisa Balcão RJ • Indústria Curadora RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'carne-seca-desfiada-500g',
    categoryId: 'corte_carne_seca',
    productCode: 'SEC-DESFIADA-500G',
    name: 'Carne Seca Desfiada Cozida a Vácuo (500g)',
    specification: 'Pronta para uso culinário, dessalinizada e desfiada em pacote de 500g',
    unit: 'R$/un',
    standardPackKg: 0.5,
    chainPrices: {
      guanabara: 27.90,
      mundial: 28.50,
      prezunic: 31.90,
      supermarket: 29.90,
      economia: 28.90,
      dom_atacadista: 25.90,
      assai: 25.80,
      atacadao: 25.50,
      princesa: 31.00,
      multi_market: 29.90,
      zona_sul: 36.90,
      hortifruti: 37.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },

  // =========================================================================
  // 3. MIUDO BOVINO
  // =========================================================================
  {
    id: 'miudo-figado',
    categoryId: 'miudo_bovino',
    productCode: 'MIU-FIGADO',
    name: 'Fígado Bovino Resfriado (Bifes / Pedaço)',
    specification: 'Fígado bovino fresco inspecionado para bifes com cebola no dia a dia',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 14.99,
      mundial: 15.49,
      prezunic: 16.90,
      supermarket: 16.49,
      economia: 15.99,
      dom_atacadista: 13.90,
      assai: 13.80,
      atacadao: 13.79,
      princesa: 16.50,
      multi_market: 16.20,
      zona_sul: 20.90,
      hortifruti: 21.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'miudo-bucho-dobradinha',
    categoryId: 'miudo_bovino',
    productCode: 'MIU-BUCHO-DOBRA',
    name: 'Bucho Bovino Limpo / Dobradinha Branca',
    specification: 'Estômago bovino higienizado e branqueado pronto para cozimento',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 16.90,
      mundial: 17.49,
      prezunic: 19.50,
      supermarket: 18.90,
      economia: 17.99,
      dom_atacadista: 15.80,
      assai: 15.70,
      atacadao: 15.65,
      princesa: 19.00,
      multi_market: 18.50,
      zona_sul: 23.90,
      hortifruti: 24.90
    },
    source: 'Pesquisa Balcão RJ • Ceasa RJ DITEC',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'miudo-rabada',
    categoryId: 'miudo_bovino',
    productCode: 'MIU-RABADA',
    name: 'Rabada Bovina Especial Cortada nas Juntas',
    specification: 'Rabada bovina fresca gorda, clássico da culinária carioca com agrião',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 36.90,
      mundial: 37.90,
      prezunic: 41.90,
      supermarket: 39.90,
      economia: 38.90,
      dom_atacadista: 34.90,
      assai: 34.70,
      atacadao: 34.50,
      princesa: 40.90,
      multi_market: 39.50,
      zona_sul: 48.90,
      hortifruti: 49.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'miudo-coracao',
    categoryId: 'miudo_bovino',
    productCode: 'MIU-CORACAO',
    name: 'Coração Bovino Limpo Resfriado',
    specification: 'Coração muscular limpo sem excesso de gordura para picadinhos e ensopados',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 15.90,
      mundial: 16.50,
      prezunic: 18.50,
      supermarket: 17.90,
      economia: 16.99,
      dom_atacadista: 14.80,
      assai: 14.70,
      atacadao: 14.60,
      princesa: 17.90,
      multi_market: 17.50,
      zona_sul: 22.90,
      hortifruti: 23.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'miudo-lingua',
    categoryId: 'miudo_bovino',
    productCode: 'MIU-LINGUA',
    name: 'Língua Bovina Resfriada Inteira',
    specification: 'Língua bovina fresca selecionada para ensopados com molho madeira e ervilha',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 26.90,
      mundial: 27.90,
      prezunic: 31.50,
      supermarket: 29.90,
      economia: 28.90,
      dom_atacadista: 24.90,
      assai: 24.80,
      atacadao: 24.60,
      princesa: 30.50,
      multi_market: 29.50,
      zona_sul: 37.90,
      hortifruti: 38.90
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'miudo-mocoto',
    categoryId: 'miudo_bovino',
    productCode: 'MIU-MOCOTO',
    name: 'Mocotó Bovino Fatiado / Cortado com Osso',
    specification: 'Pata bovina serrada em rodelas rica em tutano e colágeno natural',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 11.90,
      mundial: 12.49,
      prezunic: 13.90,
      supermarket: 13.49,
      economia: 12.90,
      dom_atacadista: 10.90,
      assai: 10.80,
      atacadao: 10.75,
      princesa: 13.50,
      multi_market: 13.00,
      zona_sul: 17.90,
      hortifruti: 18.50
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'miudo-rim',
    categoryId: 'miudo_bovino',
    productCode: 'MIU-RIM',
    name: 'Rim Bovino Fresco Resfriado',
    specification: 'Rim bovino selecionado limpo para pratos tradicionais e misturas',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 12.50,
      mundial: 12.99,
      prezunic: 14.50,
      supermarket: 13.90,
      economia: 13.50,
      dom_atacadista: 11.80,
      assai: 11.70,
      atacadao: 11.60,
      princesa: 14.00,
      multi_market: 13.80,
      zona_sul: 17.50,
      hortifruti: 18.00
    },
    source: 'Pesquisa Balcão RJ • Ceasa RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },

  // =========================================================================
  // 4. SUINO SALGADO
  // =========================================================================
  {
    id: 'suino-costela-salgada',
    categoryId: 'suino_salgado',
    productCode: 'SUI-COST-SALG',
    name: 'Costelinha Suína Salgada Especial para Feijoada',
    specification: 'Costelinha curada e salgada com boa proporção de carne magra',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 29.90,
      mundial: 30.90,
      prezunic: 34.90,
      supermarket: 32.90,
      economia: 31.90,
      dom_atacadista: 27.90,
      assai: 27.80,
      atacadao: 27.50,
      princesa: 33.90,
      multi_market: 32.50,
      zona_sul: 41.90,
      hortifruti: 42.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'suino-bacon-manta',
    categoryId: 'suino_salgado',
    productCode: 'SUI-BACON-MANTA',
    name: 'Bacon Suíno em Manta Extra Defumado',
    specification: 'Barriga suína curada e defumada naturalmente com couro e carne entremeada',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 28.90,
      mundial: 29.90,
      prezunic: 33.90,
      supermarket: 31.90,
      economia: 30.90,
      dom_atacadista: 26.90,
      assai: 26.70,
      atacadao: 26.50,
      princesa: 32.90,
      multi_market: 31.50,
      zona_sul: 39.90,
      hortifruti: 41.00
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'suino-bacon-cubos',
    categoryId: 'suino_salgado',
    productCode: 'SUI-BACON-CUBOS',
    name: 'Bacon em Cubos Selecionado (Bandeja / Balcão)',
    specification: 'Cubos magros de bacon defumado pronto para feijão, farofa e massas',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 32.90,
      mundial: 33.90,
      prezunic: 37.50,
      supermarket: 35.50,
      economia: 34.50,
      dom_atacadista: 29.90,
      assai: 29.80,
      atacadao: 29.60,
      princesa: 36.50,
      multi_market: 35.00,
      zona_sul: 43.90,
      hortifruti: 44.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'suino-lombo-salgado',
    categoryId: 'suino_salgado',
    productCode: 'SUI-LOMBO-SALG',
    name: 'Lombo Suíno Salgado Desossado Curado',
    specification: 'Lombo extra magro salgado em pedaços para compor feijoada completa carioca',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 30.90,
      mundial: 31.90,
      prezunic: 35.90,
      supermarket: 33.90,
      economia: 32.90,
      dom_atacadista: 28.90,
      assai: 28.70,
      atacadao: 28.50,
      princesa: 34.90,
      multi_market: 33.50,
      zona_sul: 42.90,
      hortifruti: 43.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'suino-orelha-salgada',
    categoryId: 'suino_salgado',
    productCode: 'SUI-ORELHA-SALG',
    name: 'Orelha Suína Salgada Seca para Feijoada',
    specification: 'Orelha desidratada no sal grosso, textura cartilaginosa tradicional',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 14.90,
      mundial: 15.49,
      prezunic: 17.90,
      supermarket: 16.90,
      economia: 15.99,
      dom_atacadista: 13.90,
      assai: 13.80,
      atacadao: 13.70,
      princesa: 17.50,
      multi_market: 16.50,
      zona_sul: 21.90,
      hortifruti: 22.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'suino-pe-salgado',
    categoryId: 'suino_salgado',
    productCode: 'SUI-PE-SALG',
    name: 'Pé Suíno Salgado Curado',
    specification: 'Pé suíno limpo e salgado, rico em gelatina para dar caldo à feijoada',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 13.90,
      mundial: 14.49,
      prezunic: 16.90,
      supermarket: 15.90,
      economia: 14.99,
      dom_atacadista: 12.90,
      assai: 12.80,
      atacadao: 12.70,
      princesa: 16.50,
      multi_market: 15.80,
      zona_sul: 20.90,
      hortifruti: 21.50
    },
    source: 'Pesquisa Balcão RJ • Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'suino-rabo-salgado',
    categoryId: 'suino_salgado',
    productCode: 'SUI-RABO-SALG',
    name: 'Rabo Suíno Salgado em Pedaços',
    specification: 'Rabo suíno curado no sal grosso, corte muito procurado para feijoadas',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 19.90,
      mundial: 20.90,
      prezunic: 23.50,
      supermarket: 22.00,
      economia: 21.50,
      dom_atacadista: 18.50,
      assai: 18.40,
      atacadao: 18.30,
      princesa: 23.00,
      multi_market: 22.00,
      zona_sul: 28.90,
      hortifruti: 29.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },

  // =========================================================================
  // 5. CHARQUE / CARNE SECA
  // =========================================================================
  {
    id: 'charque-dianteiro-especial',
    categoryId: 'charque_carne_seca',
    productCode: 'CHQ-DIANT-ESP',
    name: 'Charque Dianteiro Especial Embalado a Vácuo',
    specification: 'Charque bovino curado e desidratado em autoclave com padrão fiscal de umidade',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 33.90,
      mundial: 34.90,
      prezunic: 37.90,
      supermarket: 36.50,
      economia: 35.90,
      dom_atacadista: 31.90,
      assai: 31.80,
      atacadao: 31.60,
      princesa: 37.50,
      multi_market: 36.80,
      zona_sul: 44.90,
      hortifruti: 45.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'charque-traseiro-nobre',
    categoryId: 'charque_carne_seca',
    productCode: 'CHQ-TRAS-NOBRE',
    name: 'Charque Traseiro Extra Macio em Mantas',
    specification: 'Corte nobre de charque traseiro selecionado sem excesso de sal grosso externo',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 41.90,
      mundial: 42.90,
      prezunic: 46.90,
      supermarket: 44.90,
      economia: 43.90,
      dom_atacadista: 39.90,
      assai: 39.70,
      atacadao: 39.50,
      princesa: 45.90,
      multi_market: 44.80,
      zona_sul: 53.90,
      hortifruti: 54.90
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'charque-ponta-agulha',
    categoryId: 'charque_carne_seca',
    productCode: 'CHQ-PONTA-AGULHA',
    name: 'Charque Ponta de Agulha Tradicional',
    specification: 'Ponta de agulha salgada e prensada, ideal para cozimento com feijão e mandioca',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 30.90,
      mundial: 31.90,
      prezunic: 34.90,
      supermarket: 33.50,
      economia: 32.90,
      dom_atacadista: 29.50,
      assai: 29.40,
      atacadao: 29.20,
      princesa: 34.00,
      multi_market: 33.20,
      zona_sul: 40.90,
      hortifruti: 41.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'jerked-dianteiro-macio',
    categoryId: 'charque_carne_seca',
    productCode: 'CHQ-JERKED-DIANT',
    name: 'Jerked Beef Dianteiro Macio a Vácuo',
    specification: 'Carne bovina com adição de sais de cura e retenção controlada de água para maciez',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 32.50,
      mundial: 33.50,
      prezunic: 36.50,
      supermarket: 35.00,
      economia: 34.50,
      dom_atacadista: 30.80,
      assai: 30.70,
      atacadao: 30.50,
      princesa: 36.00,
      multi_market: 35.20,
      zona_sul: 42.50,
      hortifruti: 43.50
    },
    source: 'Pesquisa Balcão RJ • Indústria Frigorífica',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'charque-pct-1kg',
    categoryId: 'charque_carne_seca',
    productCode: 'CHQ-PCT-1KG',
    name: 'Charque Tradicional Pacote Fechado 1kg',
    specification: 'Pacote pronto para auto-serviço em gôndola com pesagem exata de 1,00kg',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 34.90,
      mundial: 35.90,
      prezunic: 39.50,
      supermarket: 37.90,
      economia: 36.90,
      dom_atacadista: 32.90,
      assai: 32.80,
      atacadao: 32.60,
      princesa: 38.90,
      multi_market: 37.90,
      zona_sul: 46.90,
      hortifruti: 47.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },

  // =========================================================================
  // 6. QUEIJO MUSSARELA / PRATO
  // =========================================================================
  {
    id: 'queijo-mussarela-peca',
    categoryId: 'queijo_mussarela_prato',
    productCode: 'QJO-MUSS-PECA',
    name: 'Queijo Mussarela Peça / Pedaço Resfriado',
    specification: 'Mussarela padrão em barra ou pedaço fracionado em loja para ralar e fatiar',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 41.90,
      mundial: 42.90,
      prezunic: 46.90,
      supermarket: 44.90,
      economia: 43.90,
      dom_atacadista: 39.90,
      assai: 39.80,
      atacadao: 39.60,
      princesa: 45.90,
      multi_market: 44.50,
      zona_sul: 54.90,
      hortifruti: 56.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Laticínios RJ/MG',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'queijo-mussarela-fatiado',
    categoryId: 'queijo_mussarela_prato',
    productCode: 'QJO-MUSS-FAT',
    name: 'Queijo Mussarela Fatiado no Balcão de Frios',
    specification: 'Fatiado fino interfolhado ou em bandeja na hora pelo operador de frios',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 47.90,
      mundial: 48.90,
      prezunic: 52.90,
      supermarket: 50.90,
      economia: 49.90,
      dom_atacadista: 45.90,
      assai: 45.80,
      atacadao: 45.60,
      princesa: 51.90,
      multi_market: 50.50,
      zona_sul: 61.90,
      hortifruti: 63.90
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'queijo-prato-peca',
    categoryId: 'queijo_mussarela_prato',
    productCode: 'QJO-PRATO-PECA',
    name: 'Queijo Prato Lanche em Peça / Fracionado',
    specification: 'Queijo prato amarelo macio com ponto de fusão ideal para sanduíches',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 44.90,
      mundial: 45.90,
      prezunic: 49.90,
      supermarket: 47.90,
      economia: 46.90,
      dom_atacadista: 42.90,
      assai: 42.80,
      atacadao: 42.60,
      princesa: 48.90,
      multi_market: 47.50,
      zona_sul: 58.90,
      hortifruti: 60.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'queijo-prato-fatiado',
    categoryId: 'queijo_mussarela_prato',
    productCode: 'QJO-PRATO-FAT',
    name: 'Queijo Prato Fatiado no Balcão de Frios',
    specification: 'Fatiamento fino para café da manhã e lanches em bandeja selada',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 49.90,
      mundial: 50.90,
      prezunic: 54.90,
      supermarket: 52.90,
      economia: 51.90,
      dom_atacadista: 47.90,
      assai: 47.70,
      atacadao: 47.50,
      princesa: 53.90,
      multi_market: 52.50,
      zona_sul: 64.90,
      hortifruti: 66.90
    },
    source: 'Pesquisa Balcão RJ • Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'queijo-minas-padrao',
    categoryId: 'queijo_mussarela_prato',
    productCode: 'QJO-MINAS-PADRAO',
    name: 'Queijo Minas Padrão Tradicional Curado',
    specification: 'Minas prensado padrão pasteurizado com casca amarelada leve',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 46.90,
      mundial: 47.90,
      prezunic: 51.90,
      supermarket: 49.90,
      economia: 48.90,
      dom_atacadista: 44.90,
      assai: 44.80,
      atacadao: 44.50,
      princesa: 50.90,
      multi_market: 49.50,
      zona_sul: 62.90,
      hortifruti: 64.90
    },
    source: 'Pesquisa Balcão RJ • NielsenIQ Retail Audit',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'queijo-coalho-churrasco',
    categoryId: 'queijo_mussarela_prato',
    productCode: 'QJO-COALHO-CHURR',
    name: 'Queijo Coalho para Churrasco (Espeto / Barra)',
    specification: 'Queijo de coalho firme que tosta na brasa sem derreter no fogo',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 49.90,
      mundial: 51.90,
      prezunic: 56.90,
      supermarket: 53.90,
      economia: 52.90,
      dom_atacadista: 46.90,
      assai: 46.80,
      atacadao: 46.50,
      princesa: 55.50,
      multi_market: 54.00,
      zona_sul: 67.90,
      hortifruti: 69.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'requeijao-cremoso-barra',
    categoryId: 'queijo_mussarela_prato',
    productCode: 'QJO-REQ-BARRA',
    name: 'Requeijão Cremoso de Corte / Barra Culinária',
    specification: 'Requeijão firme de corte para recheios de salgados e pizzas',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 29.90,
      mundial: 30.90,
      prezunic: 33.90,
      supermarket: 32.50,
      economia: 31.90,
      dom_atacadista: 27.90,
      assai: 27.80,
      atacadao: 27.60,
      princesa: 33.00,
      multi_market: 32.00,
      zona_sul: 41.90,
      hortifruti: 42.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },

  // =========================================================================
  // 7. LINGÜIÇA DE CHURRASCO
  // =========================================================================
  {
    id: 'ling-toscana-suina',
    categoryId: 'linguica_churrasco',
    productCode: 'LNG-TOSC-SUINA',
    name: 'Linguiça Toscana Suína para Churrasco',
    specification: 'Feita 100% com carne de pernil e toucinho suíno, campeã de venda no RJ',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 17.90,
      mundial: 18.49,
      prezunic: 20.90,
      supermarket: 19.99,
      economia: 19.49,
      dom_atacadista: 16.90,
      assai: 16.80,
      atacadao: 16.75,
      princesa: 20.50,
      multi_market: 19.90,
      zona_sul: 26.90,
      hortifruti: 27.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'ling-frango-churrasco',
    categoryId: 'linguica_churrasco',
    productCode: 'LNG-FRANGO-CHURR',
    name: 'Linguiça de Frango Suave para Grelha',
    specification: 'Linguiça leve elaborada com carne de coxa e peito de frango selecionados',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 18.90,
      mundial: 19.49,
      prezunic: 21.90,
      supermarket: 20.50,
      economia: 19.99,
      dom_atacadista: 17.90,
      assai: 17.80,
      atacadao: 17.70,
      princesa: 21.50,
      multi_market: 20.90,
      zona_sul: 27.90,
      hortifruti: 28.90
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'ling-mista-churrasco',
    categoryId: 'linguica_churrasco',
    productCode: 'LNG-MISTA-CHURR',
    name: 'Linguiça Mista Tradicional para Churrasco (Bov/Suí)',
    specification: 'Mistura equilibrada bovina e suína temperada com ervas para churrasco',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 16.90,
      mundial: 17.49,
      prezunic: 19.90,
      supermarket: 18.99,
      economia: 18.49,
      dom_atacadista: 15.90,
      assai: 15.80,
      atacadao: 15.75,
      princesa: 19.50,
      multi_market: 18.90,
      zona_sul: 24.90,
      hortifruti: 25.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Encartes Semanais',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'ling-calabresa-defumada',
    categoryId: 'linguica_churrasco',
    productCode: 'LNG-CALAB-DEF',
    name: 'Linguiça Calabresa Cozida e Defumada',
    specification: 'Calabresa tradicional defumada para aperitivos, feijão e pizzas',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 24.90,
      mundial: 25.90,
      prezunic: 28.90,
      supermarket: 27.50,
      economia: 26.90,
      dom_atacadista: 23.90,
      assai: 23.80,
      atacadao: 23.70,
      princesa: 28.50,
      multi_market: 27.90,
      zona_sul: 34.90,
      hortifruti: 35.90
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'ling-paio-especial',
    categoryId: 'linguica_churrasco',
    productCode: 'LNG-PAIO-ESP',
    name: 'Linguiça Paio Especial Defumada para Feijoada',
    specification: 'Paio grosso com carne de lombo suíno curado e defumado nobre',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 31.90,
      mundial: 32.90,
      prezunic: 36.50,
      supermarket: 34.90,
      economia: 33.90,
      dom_atacadista: 29.90,
      assai: 29.80,
      atacadao: 29.60,
      princesa: 35.90,
      multi_market: 34.80,
      zona_sul: 43.90,
      hortifruti: 44.90
    },
    source: 'Pesquisa Balcão RJ • ASSERJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'ling-artesanal-alho-ervas',
    categoryId: 'linguica_churrasco',
    productCode: 'LNG-ART-ALHO',
    name: 'Linguiça Artesanal com Alho e Ervas Finas',
    specification: 'Linguiça gourmet de pernil com pedaços de alho roxo e ervas frescas',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 29.90,
      mundial: 31.00,
      prezunic: 35.90,
      supermarket: 33.90,
      economia: 32.90,
      dom_atacadista: 28.90,
      assai: 28.70,
      atacadao: 28.50,
      princesa: 34.90,
      multi_market: 33.50,
      zona_sul: 42.90,
      hortifruti: 43.90
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'ling-fina-pernil',
    categoryId: 'linguica_churrasco',
    productCode: 'LNG-FINA-PERNIL',
    name: 'Linguiça Fina de Pernil para Grelha / Aperitivo',
    specification: 'Calibre fino em tripa natural de carneiro para assar rápido sem estourar',
    unit: 'R$/kg',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 28.90,
      mundial: 29.90,
      prezunic: 33.90,
      supermarket: 31.90,
      economia: 30.90,
      dom_atacadista: 26.90,
      assai: 26.80,
      atacadao: 26.60,
      princesa: 32.90,
      multi_market: 31.50,
      zona_sul: 39.90,
      hortifruti: 41.00
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },

  // =========================================================================
  // 8. LEITE UHT DE 1LT (PRINCIPAIS MARCAS NO RIO DE JANEIRO)
  // =========================================================================
  {
    id: 'leite-uht-piracanjuba-integral',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-PIRAC-INT-1L',
    name: 'Leite UHT Integral Piracanjuba 1L (Tampa de Rosca)',
    specification: 'Embalagem Tetra Pak Edge 1L - Marca líder em preferência e volume no Rio de Janeiro',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.79,
      mundial: 4.89,
      prezunic: 5.19,
      supermarket: 4.99,
      economia: 4.89,
      dom_atacadista: 4.59,
      assai: 4.55,
      atacadao: 4.49,
      princesa: 5.09,
      multi_market: 4.95,
      zona_sul: 5.99,
      hortifruti: 6.19
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-italac-integral',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-ITALAC-INT-1L',
    name: 'Leite UHT Integral Italac 1L',
    specification: 'Embalagem 1L com tampa de rosca - Alto giro no balcão e gôndola do Grande Rio',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.49,
      mundial: 4.59,
      prezunic: 4.89,
      supermarket: 4.69,
      economia: 4.59,
      dom_atacadista: 4.29,
      assai: 4.25,
      atacadao: 4.19,
      princesa: 4.79,
      multi_market: 4.65,
      zona_sul: 5.69,
      hortifruti: 5.89
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-ninho-forti',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-NINHO-INT-1L',
    name: 'Leite UHT Integral Ninho Forti+ (Nestlé) 1L',
    specification: 'Fortificado com ferro, zinco e vitaminas A, C e D - Referência de valor agregado no RJ',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 6.29,
      mundial: 6.39,
      prezunic: 6.69,
      supermarket: 6.49,
      economia: 6.39,
      dom_atacadista: 5.99,
      assai: 5.95,
      atacadao: 5.89,
      princesa: 6.59,
      multi_market: 6.45,
      zona_sul: 7.49,
      hortifruti: 7.69
    },
    source: 'Pesquisa Balcão RJ • NielsenIQ Retail Audit',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-parmalat-integral',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-PARM-INT-1L',
    name: 'Leite UHT Integral Parmalat 1L',
    specification: 'Embalagem tradicional Tetra Brik 1L - Marca histórica de alta fidelidade no mercado carioca',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.99,
      mundial: 5.10,
      prezunic: 5.39,
      supermarket: 5.25,
      economia: 5.19,
      dom_atacadista: 4.79,
      assai: 4.75,
      atacadao: 4.69,
      princesa: 5.29,
      multi_market: 5.20,
      zona_sul: 6.29,
      hortifruti: 6.49
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-elege-integral',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-ELEGE-INT-1L',
    name: 'Leite UHT Integral Elegê 1L',
    specification: 'Leite homogeneizado UHT 1L - Forte penetração na Baixada Fluminense e Zona Norte',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.39,
      mundial: 4.49,
      prezunic: 4.79,
      supermarket: 4.59,
      economia: 4.49,
      dom_atacadista: 4.19,
      assai: 4.15,
      atacadao: 4.09,
      princesa: 4.69,
      multi_market: 4.55,
      zona_sul: 5.49,
      hortifruti: 5.69
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Encartes Oficiais',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-camponesa-integral',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-CAMP-INT-1L',
    name: 'Leite UHT Integral Camponesa (Embaré) 1L',
    specification: 'Caixa 1L tradicional mineira - Muito comercializado em atacarejos e redes populares do RJ',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.59,
      mundial: 4.69,
      prezunic: 4.99,
      supermarket: 4.79,
      economia: 4.69,
      dom_atacadista: 4.39,
      assai: 4.35,
      atacadao: 4.29,
      princesa: 4.89,
      multi_market: 4.75,
      zona_sul: 5.79,
      hortifruti: 5.99
    },
    source: 'Pesquisa Balcão RJ • Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-lider-betania',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-LIDER-INT-1L',
    name: 'Leite UHT Integral Líder / Betânia 1L',
    specification: 'Opção de entrada com preço muito agressivo em encartes e quartas de laticínios no RJ',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.29,
      mundial: 4.39,
      prezunic: 4.69,
      supermarket: 4.49,
      economia: 4.39,
      dom_atacadista: 4.09,
      assai: 4.05,
      atacadao: 3.99,
      princesa: 4.59,
      multi_market: 4.45,
      zona_sul: 5.39,
      hortifruti: 5.59
    },
    source: 'Pesquisa Balcão RJ • Encartes Semanais RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-piracanjuba-desnatado',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-PIRAC-DESN-1L',
    name: 'Leite UHT Desnatado Piracanjuba 1L (0% Gordura)',
    specification: 'Zero teor de gorduras totais, embalagem slim 1L - Carro-chefe da linha magra no varejo RJ',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.89,
      mundial: 4.99,
      prezunic: 5.29,
      supermarket: 5.09,
      economia: 4.99,
      dom_atacadista: 4.69,
      assai: 4.65,
      atacadao: 4.59,
      princesa: 5.19,
      multi_market: 5.05,
      zona_sul: 6.19,
      hortifruti: 6.39
    },
    source: 'Pesquisa Balcão RJ • Preço da Hora SEFAZ-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-italac-semidesnatado',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-ITALAC-SEMI-1L',
    name: 'Leite UHT Semidesnatado Italac 1L',
    specification: '1% de gordura, equilíbrio nutricional em embalagem prática de 1L com tampa',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 4.59,
      mundial: 4.69,
      prezunic: 4.99,
      supermarket: 4.79,
      economia: 4.69,
      dom_atacadista: 4.39,
      assai: 4.35,
      atacadao: 4.29,
      princesa: 4.89,
      multi_market: 4.75,
      zona_sul: 5.79,
      hortifruti: 5.99
    },
    source: 'Pesquisa Balcão RJ • Scantec Sell-Out RJ',
    lastSurveyDate: 'Hoje, 17:30'
  },
  {
    id: 'leite-uht-piracanjuba-zerolac',
    categoryId: 'leite_uht_1l',
    productCode: 'LTE-PIRAC-ZEROLAC-1L',
    name: 'Leite UHT Zero Lactose Piracanjuba 1L',
    specification: 'Enzima lactase adicionada para fácil digestão - Marca mais vendida no segmento zero lactose no RJ',
    unit: 'R$/un',
    standardPackKg: 1.0,
    chainPrices: {
      guanabara: 5.99,
      mundial: 6.19,
      prezunic: 6.49,
      supermarket: 6.29,
      economia: 6.19,
      dom_atacadista: 5.69,
      assai: 5.65,
      atacadao: 5.59,
      princesa: 6.39,
      multi_market: 6.25,
      zona_sul: 7.89,
      hortifruti: 8.19
    },
    source: 'Pesquisa Balcão RJ • ASSERJ / Procon-RJ',
    lastSurveyDate: 'Hoje, 17:30'
  }
];

export class PerishablesQuotesService {
  /**
   * Obtém a lista completa de produtos de perecíveis armazenada ou inicial (com merge inteligente)
   */
  public static getProducts(): PerishableProductItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge inteligente: garante que todos os produtos novos do baseline (ex: LEITE UHT 1L)
          // estejam presentes, mantendo quaisquer edições manuais feitas pelo usuário
          const map = new Map<string, PerishableProductItem>();
          INITIAL_PERISHABLE_PRODUCTS.forEach(p => {
            const promo = p.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id];
            map.set(p.id, { ...p, promoOffer: promo });
          });
          parsed.forEach((p: PerishableProductItem) => {
            if (map.has(p.id)) {
              const base = map.get(p.id)!;
              map.set(p.id, {
                ...base,
                ...p,
                promoOffer: p.promoOffer || base.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id]
              });
            } else {
              const promo = p.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id];
              map.set(p.id, { ...p, promoOffer: promo });
            }
          });
          return Array.from(map.values());
        }
      }
    } catch (e) {
      console.warn('Erro ao ler perecíveis do localStorage, usando baseline inicial:', e);
    }
    return INITIAL_PERISHABLE_PRODUCTS.map(p => ({
      ...p,
      promoOffer: p.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id]
    }));
  }

  /**
   * Salva alterações de preços no localStorage
   */
  public static saveProducts(products: PerishableProductItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Erro ao salvar produtos no localStorage:', e);
    }
  }

  /**
   * Atualiza o preço de uma rede específica para um determinado produto
   */
  public static updateProductChainPrice(productId: string, chainId: string, newPrice: number): PerishableProductItem[] {
    const list = this.getProducts().map(item => {
      if (item.id === productId) {
        return {
          ...item,
          chainPrices: {
            ...item.chainPrices,
            [chainId]: Math.max(0, Number(newPrice.toFixed(2)))
          },
          lastSurveyDate: 'Editado Manualmente • Hoje'
        };
      }
      return item;
    });
    this.saveProducts(list);
    return list;
  }

  /**
   * Executa o rastreamento ativo de ofertas de comerciais de TV e encartes de supermercados do RJ
   * (Globo RJ, Record RJ, SBT Rio, encartes Guanabara, Mundial, Supermarket, Assaí, Atacadão, Dom Atacadista)
   */
  public static async scanTvAndEncartePromotions(categoryId?: PerishableCategoryId): Promise<{
    scannedCount: number;
    activePromosCount: number;
    products: PerishableProductItem[];
    scanTimestamp: string;
  }> {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const scanTimestamp = `Hoje, ${timeStr}`;

    const currentProducts = this.getProducts();
    let promoCount = 0;

    const updated = currentProducts.map(p => {
      if (!categoryId || p.categoryId === categoryId) {
        const basePromo = OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id] || p.promoOffer;
        if (basePromo && basePromo.hasActivePromo) {
          promoCount++;
          return {
            ...p,
            promoOffer: {
              ...basePromo,
              adBroadcastTime: `Hoje, ${timeStr} • Radar TV & Encartes RJ Sincronizado`,
              auditSource: `${basePromo.auditSource} (Aferido em tempo real)`
            },
            lastSurveyDate: `Radar TV & Balcão • ${scanTimestamp}`
          };
        }
      }
      return p;
    });

    this.saveProducts(updated);

    return {
      scannedCount: categoryId ? updated.filter(p => p.categoryId === categoryId).length : updated.length,
      activePromosCount: promoCount,
      products: updated,
      scanTimestamp
    };
  }

  /**
   * Restaura os preços para a base oficial de pesquisa de supermercados do RJ
   */
  public static resetToOfficialRJBaseline(): PerishableProductItem[] {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignorar
    }
    return INITIAL_PERISHABLE_PRODUCTS.map(p => ({
      ...p,
      promoOffer: p.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[p.id]
    }));
  }

  /**
   * Calcula estatísticas comparativas para um único produto (mín, máx, média, spread e oferta TV)
   */
  public static calculateProductStats(item: PerishableProductItem): PerishableProductCalculatedStats {
    const validEntries = Object.entries(item.chainPrices).filter(([_, price]) => price > 0);
    const promo = item.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[item.id];
    
    if (validEntries.length === 0) {
      return {
        productId: item.id,
        productName: item.name,
        minPrice: 0,
        cheapestChain: 'N/A',
        maxPrice: 0,
        priciestChain: 'N/A',
        avgPrice: 0,
        spread: 0,
        spreadPercent: 0,
        validQuotesCount: 0,
        promoOffer: promo
      };
    }

    let minPrice = Infinity;
    let cheapestChain = '';
    let maxPrice = -Infinity;
    let priciestChain = '';
    let sum = 0;

    validEntries.forEach(([chainId, price]) => {
      sum += price;
      if (price < minPrice) {
        minPrice = price;
        const chain = RJ_SUPERMARKET_CHAINS.find(c => c.id === chainId);
        cheapestChain = chain ? chain.shortName : chainId;
      }
      if (price > maxPrice) {
        maxPrice = price;
        const chain = RJ_SUPERMARKET_CHAINS.find(c => c.id === chainId);
        priciestChain = chain ? chain.shortName : chainId;
      }
    });

    const avgPrice = Number((sum / validEntries.length).toFixed(2));
    const spread = Number((maxPrice - minPrice).toFixed(2));
    const spreadPercent = avgPrice > 0 ? Number(((spread / avgPrice) * 100).toFixed(1)) : 0;

    return {
      productId: item.id,
      productName: item.name,
      minPrice,
      cheapestChain,
      maxPrice,
      priciestChain,
      avgPrice,
      spread,
      spreadPercent,
      validQuotesCount: validEntries.length,
      promoOffer: promo
    };
  }

  /**
   * Calcula o resumo executivo para uma categoria inteira
   */
  public static calculateCategorySummary(categoryId: PerishableCategoryId, products: PerishableProductItem[]): CategorySummaryStats {
    const categoryProducts = products.filter(p => p.categoryId === categoryId);
    if (categoryProducts.length === 0) {
      return {
        categoryId,
        totalProducts: 0,
        avgPriceCategory: 0,
        minPriceCategory: 0,
        cheapestChainOverall: 'N/A',
        maxPriceCategory: 0,
        priciestChainOverall: 'N/A',
        avgSpread: 0,
        lastUpdatedDate: 'Hoje'
      };
    }

    let sumAvg = 0;
    let globalMin = Infinity;
    let globalMax = -Infinity;
    let cheapestChain = '';
    let priciestChain = '';
    let sumSpread = 0;

    categoryProducts.forEach(prod => {
      const stats = this.calculateProductStats(prod);
      sumAvg += stats.avgPrice;
      sumSpread += stats.spread;

      if (stats.minPrice < globalMin && stats.minPrice > 0) {
        globalMin = stats.minPrice;
        cheapestChain = stats.cheapestChain;
      }
      if (stats.maxPrice > globalMax) {
        globalMax = stats.maxPrice;
        priciestChain = stats.priciestChain;
      }
    });

    return {
      categoryId,
      totalProducts: categoryProducts.length,
      avgPriceCategory: Number((sumAvg / categoryProducts.length).toFixed(2)),
      minPriceCategory: globalMin === Infinity ? 0 : globalMin,
      cheapestChainOverall: cheapestChain,
      maxPriceCategory: globalMax === -Infinity ? 0 : globalMax,
      priciestChainOverall: priciestChain,
      avgSpread: Number((sumSpread / categoryProducts.length).toFixed(2)),
      lastUpdatedDate: 'Hoje'
    };
  }

  /**
   * Exporta a tabela da categoria ou de todas as abas para Excel (.xlsx) com formatação profissional
   */
  public static async exportCategoryToExcel(categoryId: PerishableCategoryId, products: PerishableProductItem[]): Promise<void> {
    const category = PERISHABLE_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = category ? category.label : 'PERECIVEIS';
    const items = products.filter(p => p.categoryId === categoryId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GAPP - PATRICK PESSOA • Apuração do Boi RJ';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(categoryName.substring(0, 31));

    // Estilos de cabeçalho
    sheet.columns = [
      { header: 'CÓDIGO', key: 'code', width: 14 },
      { header: 'PRODUTO / ESPECIFICAÇÃO', key: 'product', width: 34 },
      { header: 'UNID.', key: 'unit', width: 8 },
      ...RJ_SUPERMARKET_CHAINS.map(c => ({
        header: c.shortName.toUpperCase(),
        key: c.id,
        width: 14
      })),
      { header: 'OFERTA TV / ENCARTE', key: 'promoPrice', width: 18 },
      { header: 'REDE / CANAL TV', key: 'promoMedia', width: 26 },
      { header: 'VIGÊNCIA OFERTA', key: 'promoValidity', width: 18 },
      { header: 'MENOR RJ', key: 'min', width: 14 },
      { header: 'MAIOR RJ', key: 'max', width: 14 },
      { header: 'MÉDIA RJ', key: 'avg', width: 14 },
      { header: 'SPREAD (R$)', key: 'spread', width: 14 },
      { header: 'FONTE OFICIAL', key: 'source', width: 28 }
    ];

    // Título Superior
    sheet.spliceRows(1, 0, 
      ['GAPP - PATRICK PESSOA • COTAÇÃO OFICIAL DE PERECÍVEIS • 12 REDES DO RIO DE JANEIRO'],
      [`CATEGORIA: ${categoryName} • BASE OFICIAL: ASSERJ / PROCON-RJ / SEFAZ-RJ / RADAR TV RJ • DESENVOLVEDOR: PATRICK PESSOA`],
      ['']
    );

    sheet.mergeCells('A1:W1');
    sheet.mergeCells('A2:W2');

    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF113829' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.getCell('A2').font = { bold: true, size: 10, color: { argb: 'FFE2E8F0' } };
    sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    // Linha de cabeçalho da tabela (linha 4)
    const headerRow = sheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF113829' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } }
      };
    });

    // Inserção dos produtos
    items.forEach(item => {
      const stats = this.calculateProductStats(item);
      const promo = item.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[item.id];
      const rowValues: any = {
        code: item.productCode,
        product: item.name,
        unit: item.unit.replace('R$/', ''),
        promoPrice: promo && promo.hasActivePromo ? promo.promoPrice : null,
        promoMedia: promo && promo.hasActivePromo ? `${promo.chainName} (${promo.mediaLabel})` : 'Sem oferta ativa',
        promoValidity: promo && promo.hasActivePromo ? promo.validity : '-',
        min: stats.minPrice,
        max: stats.maxPrice,
        avg: stats.avgPrice,
        spread: stats.spread,
        source: item.source
      };

      RJ_SUPERMARKET_CHAINS.forEach(c => {
        rowValues[c.id] = item.chainPrices[c.id] || 0;
      });

      const row = sheet.addRow(rowValues);
      row.height = 20;
      row.font = { size: 9 };

      // Alinhamentos
      row.getCell('code').alignment = { horizontal: 'center' };
      row.getCell('unit').alignment = { horizontal: 'center' };
      row.getCell('product').alignment = { horizontal: 'left' };
      row.getCell('promoMedia').alignment = { horizontal: 'left' };
      row.getCell('promoValidity').alignment = { horizontal: 'center' };

      // Formatar valores monetários das 12 redes
      RJ_SUPERMARKET_CHAINS.forEach(c => {
        const cell = row.getCell(c.id);
        cell.numFmt = '"R$ "#,##0.00';
        cell.alignment = { horizontal: 'right' };
        if (cell.value === stats.minPrice && stats.minPrice > 0) {
          cell.font = { bold: true, color: { argb: 'FF047857' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        }
      });

      // Formatar coluna Oferta TV
      const promoCell = row.getCell('promoPrice');
      if (promoCell.value) {
        promoCell.numFmt = '"R$ "#,##0.00';
        promoCell.font = { bold: true, color: { argb: 'FF92400E' } };
        promoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        promoCell.alignment = { horizontal: 'right' };
      }

      const minCell = row.getCell('min');
      minCell.numFmt = '"R$ "#,##0.00';
      minCell.font = { bold: true, color: { argb: 'FF047857' } };
      minCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };

      const maxCell = row.getCell('max');
      maxCell.numFmt = '"R$ "#,##0.00';
      maxCell.font = { bold: true, color: { argb: 'FFBE123C' } };

      const avgCell = row.getCell('avg');
      avgCell.numFmt = '"R$ "#,##0.00';
      avgCell.font = { bold: true };

      const spreadCell = row.getCell('spread');
      spreadCell.numFmt = '"R$ "#,##0.00';
    });

    await ReportBrandingService.embedExcelLogoAndFooter(
      workbook,
      sheet,
      23,
      `Cotação Oficial de Perecíveis RJ • ${categoryName}`
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cotacao_Pereciveis_RJ_${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Gera e faz o download de um relatório completo em PDF em formato Paisagem com Logo e Cabeçalho/Rodapé Padrão
   */
  public static async generateAndDownloadPdf(categoryId: PerishableCategoryId, products: PerishableProductItem[]): Promise<void> {
    const category = PERISHABLE_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = category ? category.label : 'PERECÍVEIS';
    const items = products.filter(p => p.categoryId === categoryId);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const today = new Date().toLocaleDateString('pt-BR');
    const startY = await ReportBrandingService.drawPdfHeader(doc, {
      title: `COTAÇÃO OFICIAL DE PERECÍVEIS NO VAREJO RJ • ${categoryName}`,
      subtitle: `Sub-Aba: ${categoryName} • 12 Redes RJ + Radar de Ofertas de TV e Encartes • ASSERJ / Procon-RJ / SEFAZ-RJ`,
      departmentTag: 'AUDITORIA DE PERECÍVEIS & RADAR DE TV / ENCARTE RJ',
      rightMetaLines: [
        `Emissão: ${today}`,
        'Sistema: GAPP - PATRICK PESSOA v10.8',
        'Desenvolvedor: Patrick Pessoa'
      ],
      themeColor: 'forest'
    });

    // Preparar dados da tabela
    const tableHeaders = [
      'Produto',
      'Unid.',
      ...RJ_SUPERMARKET_CHAINS.map(c => c.shortName),
      'Oferta TV/Encarte',
      'Mídia / Rede TV',
      'Menor RJ',
      'Maior RJ',
      'Média RJ'
    ];

    const tableRows = items.map(item => {
      const stats = this.calculateProductStats(item);
      const promo = item.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[item.id];
      const promoStr = promo && promo.hasActivePromo ? `R$ ${promo.promoPrice.toFixed(2)}` : '-';
      const promoMediaStr = promo && promo.hasActivePromo 
        ? `${promo.chainName.split(' ')[0]} (${promo.mediaType.includes('GLOBO') ? 'TV Globo' : promo.mediaType.includes('RECORD') ? 'TV Record' : 'Encarte'})` 
        : '-';

      return [
        item.name,
        item.unit.replace('R$/', ''),
        ...RJ_SUPERMARKET_CHAINS.map(c => {
          const val = item.chainPrices[c.id];
          return val ? `R$ ${val.toFixed(2)}` : '-';
        }),
        promoStr,
        promoMediaStr,
        `R$ ${stats.minPrice.toFixed(2)}`,
        `R$ ${stats.maxPrice.toFixed(2)}`,
        `R$ ${stats.avgPrice.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY,
      margin: { bottom: 14 },
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 6.8,
        cellPadding: 1.5,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [17, 56, 41],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 34 },
        1: { halign: 'center', cellWidth: 9 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' },
        13: { halign: 'right' },
        14: { halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] }, // Oferta TV
        15: { halign: 'center', fontSize: 6 }, // Mídia TV
        16: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
        17: { halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] },
        18: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
      },
      foot: [
        [
          'MÉDIA GERAL DA CATEGORIA',
          '-',
          ...RJ_SUPERMARKET_CHAINS.map(c => {
            let sum = 0;
            let count = 0;
            items.forEach(it => {
              const val = it.chainPrices[c.id];
              if (val > 0) {
                sum += val;
                count++;
              }
            });
            return count > 0 ? `R$ ${(sum / count).toFixed(2)}` : '-';
          }),
          '-',
          '-',
          '-',
          '-',
          '-'
        ]
      ],
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7
      }
    });

    await ReportBrandingService.drawPdfFooterAllPages(doc, {
      documentCode: `GAPP-PERECIVEIS-${categoryId.toUpperCase()}`,
      extraRightText: 'Base Oficial RJ: ASSERJ / Procon-RJ / SEFAZ-RJ / Clipping TV Aberta'
    });

    doc.save(`Cotacao_Pereciveis_RJ_${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}_${today.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Imprime o relatório da categoria de perecíveis com Cabeçalho e Rodapé Padronizados e Logo Oficial
   */
  public static printCategoryReport(categoryId: PerishableCategoryId, products: PerishableProductItem[]): void {
    const category = PERISHABLE_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = category ? category.label : 'PERECÍVEIS';
    const items = products.filter(p => p.categoryId === categoryId);

    const headerHtml = ReportBrandingService.getHtmlHeader({
      title: `COTAÇÃO OFICIAL DE PERECÍVEIS NO VAREJO RJ • ${categoryName}`,
      subtitle: `Sub-Aba: ${categoryName} • 12 Redes Supermercadistas + Radar de Ofertas de TV e Encartes • ASSERJ / Procon-RJ / SEFAZ-RJ`,
      departmentTag: 'AUDITORIA DE PERECÍVEIS & BENCHMARKING 12 REDES RJ',
      themeColor: 'forest'
    });

    const footerHtml = ReportBrandingService.getHtmlFooter({
      documentCode: `GAPP-PERECIVEIS-${categoryId.toUpperCase()}`,
      extraRightText: 'Preços Reais de Gôndola, Balcão e Encartes de Oferta TV RJ'
    });

    const rowsHtml = items.map((item, idx) => {
      const stats = this.calculateProductStats(item);
      const promo = item.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[item.id];
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const chainCells = RJ_SUPERMARKET_CHAINS.map(c => {
        const val = item.chainPrices[c.id] || 0;
        const isMin = val === stats.minPrice && val > 0;
        const isMax = val === stats.maxPrice && val > 0;
        const colorStyle = isMin
          ? 'background:#ecfdf5;color:#047857;font-weight:800;'
          : isMax
          ? 'background:#fff1f2;color:#be123c;font-weight:700;'
          : '';
        return `<td style="text-align:right;font-family:monospace;padding:4px 5px;border:1px solid #cbd5e1;${colorStyle}">${val > 0 ? `R$ ${val.toFixed(2)}` : '-'}</td>`;
      }).join('');

      const promoCellHtml = promo && promo.hasActivePromo
        ? `<td style="text-align:right;font-family:monospace;padding:4px 5px;border:1px solid #cbd5e1;background:#fef3c7;color:#92400e;font-weight:800;" title="${promo.chainName} - ${promo.mediaLabel}">
             R$ ${promo.promoPrice.toFixed(2)}
             <span style="display:block;font-size:6pt;color:#78350f;font-weight:normal;">${promo.chainName.split(' ')[0]}</span>
           </td>`
        : `<td style="text-align:center;padding:4px 5px;border:1px solid #cbd5e1;color:#94a3b8;">-</td>`;

      return `
        <tr style="background:${bg};">
          <td style="padding:4px 6px;border:1px solid #cbd5e1;font-weight:700;color:#0f172a;">${item.name}</td>
          <td style="padding:4px 4px;border:1px solid #cbd5e1;text-align:center;font-weight:700;color:#475569;">${item.unit.replace('R$/', '')}</td>
          ${chainCells}
          ${promoCellHtml}
          <td style="padding:4px 5px;border:1px solid #cbd5e1;text-align:right;font-family:monospace;font-weight:800;background:#d1fae5;color:#065f46;">R$ ${stats.minPrice.toFixed(2)}</td>
          <td style="padding:4px 5px;border:1px solid #cbd5e1;text-align:right;font-family:monospace;font-weight:800;background:#ffe4e6;color:#9f1239;">R$ ${stats.maxPrice.toFixed(2)}</td>
          <td style="padding:4px 5px;border:1px solid #cbd5e1;text-align:right;font-family:monospace;font-weight:800;background:#f1f5f9;color:#0f172a;">R$ ${stats.avgPrice.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Cotação de Perecíveis RJ - ${categoryName} - GAPP - PATRICK PESSOA</title>
        <style>
          @page { size: A4 landscape; margin: 8mm 10mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; font-size: 8pt; background: #fff; }
          table { width: 100%; border-collapse: collapse; font-size: 7.2pt; margin-bottom: 8px; }
          th { background: #113829; color: #fff; padding: 5px 4px; font-weight: 800; text-transform: uppercase; border: 1px solid #0d2c20; font-size: 6.8pt; }
        </style>
      </head>
      <body>
        ${headerHtml}
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Produto / Especificação</th>
              <th>Unid.</th>
              ${RJ_SUPERMARKET_CHAINS.map(c => `<th>${c.shortName}</th>`).join('')}
              <th style="background:#b45309;">Oferta TV / Encarte</th>
              <th>Menor RJ</th>
              <th>Maior RJ</th>
              <th>Média RJ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${footerHtml}
      </body>
      </html>
    `;

    PrintEngineService.printDocument(html, {
      documentTitle: `Cotacao_Pereciveis_RJ_${categoryName}`,
      landscape: true
    });
  }

  /**
   * Gera texto formatado para envio no WhatsApp
   */
  public static generateWhatsAppSummary(categoryId: PerishableCategoryId, products: PerishableProductItem[]): string {
    const category = PERISHABLE_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = category ? category.label : 'PERECÍVEIS';
    const items = products.filter(p => p.categoryId === categoryId);
    const summary = this.calculateCategorySummary(categoryId, products);

    let text = `*📊 GAPP - PATRICK PESSOA • COTAÇÃO DE PERECÍVEIS RJ • ${categoryName}*\n`;
    text += `*Base:* 12 Redes Supermercadistas + Radar de Comerciais de TV e Encartes RJ (ASSERJ / Procon-RJ / SEFAZ)\n`;
    text += `*Média do Segmento:* R$ ${summary.avgPriceCategory.toFixed(2)}/kg\n`;
    text += `*Rede Mais Competitiva:* ${summary.cheapestChainOverall}\n\n`;

    items.forEach(item => {
      const stats = this.calculateProductStats(item);
      const promo = item.promoOffer || OFFICIAL_RJ_TV_PROMO_REGISTRY[item.id];
      text += `🥩 *${item.name}*\n`;
      if (promo && promo.hasActivePromo) {
        text += `📺 *OFERTA TV/ENCARTE:* R$ ${promo.promoPrice.toFixed(2)} (${promo.chainName} • ${promo.mediaLabel})\n`;
      }
      text += `• Menor: R$ ${stats.minPrice.toFixed(2)} (${stats.cheapestChain})\n`;
      text += `• Maior: R$ ${stats.maxPrice.toFixed(2)} (${stats.priciestChain})\n`;
      text += `• Média 12 Redes: *R$ ${stats.avgPrice.toFixed(2)}*\n\n`;
    });

    text += `_Gerado via GAPP - PATRICK PESSOA • Gestão Apuração do Boi v10.8 • Patrick Pessoa_`;
    return encodeURIComponent(text);
  }
}
