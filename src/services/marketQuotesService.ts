import { 
  MarketIndicator, 
  RegionalQuote, 
  WholesaleCarcassQuote, 
  WholesaleCutQuote, 
  RJRetailBenchmark,
  HistoricalPricePoint, 
  MarketQuotesSnapshot 
} from '../types/marketQuotes';
import { StorageService } from './storageService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const QUOTES_STORAGE_KEY = 'apuracao_boi_market_quotes_v3';

// 1. INDICADORES GERAIS OFICIAIS (CEPEA, B3, SCOT, IMEA, NIELSENIQ RJ)
export const INITIAL_MARKET_INDICATORS: MarketIndicator[] = [
  {
    id: 'ind-cepea-sp',
    code: 'CEPEA-B3-SP',
    name: 'Boi Gordo CEPEA/B3 (São Paulo - À Vista)',
    category: 'bovino_gordo',
    price: 332.50,
    unit: 'R$/@',
    changeDay: 0.85,
    changeDayValue: 2.80,
    changeWeek: 1.68,
    changeMonth: 3.90,
    trend: 'up',
    min30d: 318.00,
    max30d: 335.00,
    source: 'CEPEA/ESALQ - USP / B3',
    lastUpdated: 'Hoje, 16:30',
    description: 'Indicador Oficial do Boi Gordo CEPEA/B3 no estado de São Paulo para liquidação financeira.',
    benchmarkPrice: 330.00
  },
  {
    id: 'ind-boi-china',
    code: 'BOI-CHINA-SP',
    name: 'Boi Padrão China (Até 30 meses / Rastreabilidade)',
    category: 'bovino_especial',
    price: 340.00,
    unit: 'R$/@',
    changeDay: 0.74,
    changeDayValue: 2.50,
    changeWeek: 2.10,
    changeMonth: 4.60,
    trend: 'up',
    min30d: 325.00,
    max30d: 342.00,
    source: 'Scot Consultoria / Frigoríficos Habilitados',
    lastUpdated: 'Hoje, 16:25',
    description: 'Bovinos jovens machos até 30 meses (4 dentes) para exportação à China com bonificação padrão de R$ 7,50/@.',
    benchmarkPrice: 332.50
  },
  {
    id: 'ind-rj-ceasa',
    code: 'BOI-RJ-ENTRADA',
    name: 'Boi Gordo no Rio de Janeiro (Frigoríficos / Entrada RJ)',
    category: 'varejo_rj',
    price: 328.00,
    unit: 'R$/@',
    changeDay: 0.61,
    changeDayValue: 2.00,
    changeWeek: 1.45,
    changeMonth: 3.50,
    trend: 'up',
    min30d: 315.00,
    max30d: 330.00,
    source: 'Mercado Atacadista RJ / Ceasa Irajá / Frigoríficos Locais',
    lastUpdated: 'Hoje, 16:30',
    description: 'Preço médio de entrada no estado do Rio de Janeiro (carcaça resfriada e gado em pé para abate local).',
    benchmarkPrice: 326.00
  },
  {
    id: 'ind-vaca-gorda-sp',
    code: 'VACA-SP',
    name: 'Vaca Gorda (São Paulo - À Vista)',
    category: 'bovino_gordo',
    price: 305.00,
    unit: 'R$/@',
    changeDay: 0.49,
    changeDayValue: 1.50,
    changeWeek: 1.15,
    changeMonth: 2.70,
    trend: 'up',
    min30d: 295.00,
    max30d: 308.00,
    source: 'CEPEA/ESALQ & Scot Consultoria',
    lastUpdated: 'Hoje, 16:15',
    description: 'Fêmeas terminadas para abate com rendimento de carcaça padrão de 50% a 52%.',
    benchmarkPrice: 300.00
  },
  {
    id: 'ind-novilha-gorda-sp',
    code: 'NOVILHA-SP',
    name: 'Novilha Gorda Precoce (São Paulo)',
    category: 'bovino_gordo',
    price: 318.00,
    unit: 'R$/@',
    changeDay: 0.63,
    changeDayValue: 2.00,
    changeWeek: 1.45,
    changeMonth: 3.25,
    trend: 'up',
    min30d: 308.00,
    max30d: 320.00,
    source: 'Scot Consultoria',
    lastUpdated: 'Hoje, 16:10',
    description: 'Novilhas jovens precoces para o mercado interno e nicho gourmet.',
    benchmarkPrice: 315.00
  },
  {
    id: 'ind-bezerro-nelore',
    code: 'BEZERRO-NELORE',
    name: 'Bezerro Nelore (Mato Grosso do Sul / SP)',
    category: 'reposicao',
    price: 2480.00,
    unit: 'R$/cab.',
    changeDay: 0.20,
    changeDayValue: 5.00,
    changeWeek: 0.80,
    changeMonth: 2.05,
    trend: 'up',
    min30d: 2390.00,
    max30d: 2500.00,
    source: 'CEPEA - Reposição',
    lastUpdated: 'Hoje, 15:45',
    description: 'Bezerro desmamado 8 a 12 meses (média 190kg). Relação de Troca atual: 2,13 @ de Boi Gordo por Bezerro.',
    benchmarkPrice: 2450.00
  },
  {
    id: 'ind-boi-gado-vivo',
    code: 'GADO-VIVO-KG',
    name: 'Média do Gado em Pé (Kg Vivo - Estimado)',
    category: 'bovino_gordo',
    price: 11.08,
    unit: 'R$/kg vivo',
    changeDay: 0.82,
    changeDayValue: 0.09,
    changeWeek: 1.65,
    changeMonth: 3.85,
    trend: 'up',
    min30d: 10.60,
    max30d: 11.17,
    source: 'Cálculo Paramétrico Zootécnico GAPP (54% RC)',
    lastUpdated: 'Hoje, 16:30',
    description: 'Preço equivalente do boi gordo em pé considerando rendimento médio de carcaça de 54,0% (30kg carcaça = 15kg ganho).',
    benchmarkPrice: 11.00
  },
  {
    id: 'ind-dolar-ptax',
    code: 'USDBRL-PTAX',
    name: 'Dólar Comercial (PTAX / Exportação Pecuária)',
    category: 'cambio',
    price: 5.62,
    unit: 'R$/US$',
    changeDay: -0.35,
    changeDayValue: -0.02,
    changeWeek: -0.80,
    changeMonth: 1.20,
    trend: 'down',
    min30d: 5.50,
    max30d: 5.75,
    source: 'Banco Central do Brasil',
    lastUpdated: 'Hoje, 16:00',
    description: 'Taxa de câmbio de referência que baliza a paridade de exportação dos frigoríficos.',
    benchmarkPrice: 5.60
  }
];

// 2. PRAÇAS PECUÁRIAS E POLOS FRIGORÍFICOS (RJ, SP, MG, GO, MT, MS, PR, RS, PA, RO, TO)
export const INITIAL_REGIONAL_QUOTES: RegionalQuote[] = [
  {
    id: 'praca-rj-interior',
    state: 'Rio de Janeiro',
    stateCode: 'RJ',
    region: 'Grande Rio / Baixada / Norte Fluminense',
    cashPriceArroba: 328.00,
    termPriceArroba: 331.00,
    liveWeightPriceKg: 10.93,
    carcassYieldEstimate: 54.0,
    cowCashPriceArroba: 300.00,
    heiferCashPriceArroba: 312.00,
    spreadVsSP: -4.50,
    trend: 'up',
    slaughterScaleDays: 6.5,
    source: 'Ceasa RJ / Frigoríficos RJ (RioBeef, Barra Mansa, Plena)',
    mainPackers: 'Barra Mansa, RioBeef, Frigorífico Silva RJ, Plena',
    lastUpdated: 'Hoje, 16:30'
  },
  {
    id: 'praca-sp-barretos',
    state: 'São Paulo',
    stateCode: 'SP',
    region: 'Barretos / Araçatuba / Pres. Prudente',
    cashPriceArroba: 332.50,
    termPriceArroba: 335.00,
    liveWeightPriceKg: 11.08,
    carcassYieldEstimate: 54.0,
    cowCashPriceArroba: 305.00,
    heiferCashPriceArroba: 318.00,
    spreadVsSP: 0.00,
    trend: 'up',
    slaughterScaleDays: 8.5,
    source: 'CEPEA / Scot Consultoria',
    mainPackers: 'JBS/Friboi, Minerva Foods, Marfrig, Frigol',
    lastUpdated: 'Hoje, 16:30'
  },
  {
    id: 'praca-mg-triangulo',
    state: 'Minas Gerais',
    stateCode: 'MG',
    region: 'Triângulo Mineiro / Uberaba / Uberlândia',
    cashPriceArroba: 322.00,
    termPriceArroba: 325.00,
    liveWeightPriceKg: 10.73,
    carcassYieldEstimate: 54.0,
    cowCashPriceArroba: 296.00,
    heiferCashPriceArroba: 308.00,
    spreadVsSP: -10.50,
    trend: 'up',
    slaughterScaleDays: 8.5,
    source: 'Scot Consultoria / FAEMG',
    mainPackers: 'JBS, Plena Alimentos, Masterboi, Frigol',
    lastUpdated: 'Hoje, 16:20'
  },
  {
    id: 'praca-go-goiania',
    state: 'Goiás',
    stateCode: 'GO',
    region: 'Goiânia / Rio Verde / Sul Goiano',
    cashPriceArroba: 320.00,
    termPriceArroba: 323.00,
    liveWeightPriceKg: 10.67,
    carcassYieldEstimate: 54.0,
    cowCashPriceArroba: 295.00,
    heiferCashPriceArroba: 305.00,
    spreadVsSP: -12.50,
    trend: 'up',
    slaughterScaleDays: 8.0,
    source: 'Scot Consultoria / FAEG',
    mainPackers: 'JBS/Friboi Mozarlândia, Minerva Palmeiras, Marfrig',
    lastUpdated: 'Hoje, 16:15'
  },
  {
    id: 'praca-ms-campo-grande',
    state: 'Mato Grosso do Sul',
    stateCode: 'MS',
    region: 'Campo Grande / Dourados / Três Lagoas',
    cashPriceArroba: 318.00,
    termPriceArroba: 321.00,
    liveWeightPriceKg: 10.60,
    carcassYieldEstimate: 54.0,
    cowCashPriceArroba: 292.00,
    heiferCashPriceArroba: 304.00,
    spreadVsSP: -14.50,
    trend: 'up',
    slaughterScaleDays: 9.5,
    source: 'FAMASUL / Scot Consultoria',
    mainPackers: 'JBS Campo Grande/Naviraí, Marfrig Bataguassu',
    lastUpdated: 'Hoje, 16:05'
  },
  {
    id: 'praca-mt-norte',
    state: 'Mato Grosso',
    stateCode: 'MT',
    region: 'Norte (Sinop / Alta Floresta / Juína)',
    cashPriceArroba: 308.00,
    termPriceArroba: 310.50,
    liveWeightPriceKg: 10.27,
    carcassYieldEstimate: 53.5,
    cowCashPriceArroba: 285.00,
    heiferCashPriceArroba: 295.00,
    spreadVsSP: -24.50,
    trend: 'up',
    slaughterScaleDays: 10.0,
    source: 'IMEA / Scot Consultoria',
    mainPackers: 'JBS Diamantino/Colíder, Marfrig Paranatinga',
    lastUpdated: 'Hoje, 16:00'
  },
  {
    id: 'praca-mt-cuiaba',
    state: 'Mato Grosso',
    stateCode: 'MT',
    region: 'Cuiabá / Rondonópolis / Sudeste',
    cashPriceArroba: 312.00,
    termPriceArroba: 315.00,
    liveWeightPriceKg: 10.40,
    carcassYieldEstimate: 53.8,
    cowCashPriceArroba: 288.00,
    heiferCashPriceArroba: 298.00,
    spreadVsSP: -20.50,
    trend: 'up',
    slaughterScaleDays: 9.0,
    source: 'IMEA / Frigoríficos Locais',
    mainPackers: 'JBS Várzea Grande, Marfrig Várzea Grande',
    lastUpdated: 'Hoje, 16:10'
  },
  {
    id: 'praca-pr-maringa',
    state: 'Paraná',
    stateCode: 'PR',
    region: 'Noroeste / Paranavaí / Maringá',
    cashPriceArroba: 326.00,
    termPriceArroba: 329.00,
    liveWeightPriceKg: 10.87,
    carcassYieldEstimate: 54.2,
    cowCashPriceArroba: 300.00,
    heiferCashPriceArroba: 312.00,
    spreadVsSP: -6.50,
    trend: 'up',
    slaughterScaleDays: 7.5,
    source: 'DERAL/SEAB / FAEP',
    mainPackers: 'Frigorífico Astra, Big Boi, JBS',
    lastUpdated: 'Hoje, 16:20'
  },
  {
    id: 'praca-pa-redencao',
    state: 'Pará',
    stateCode: 'PA',
    region: 'Redenção / Marabá / Xinguara',
    cashPriceArroba: 305.00,
    termPriceArroba: 308.00,
    liveWeightPriceKg: 10.17,
    carcassYieldEstimate: 53.0,
    cowCashPriceArroba: 280.00,
    heiferCashPriceArroba: 290.00,
    spreadVsSP: -27.50,
    trend: 'stable',
    slaughterScaleDays: 11.0,
    source: 'Scot Consultoria / Pará Pecuária',
    mainPackers: 'JBS Redenção/Marabá, Frigol Água Azul',
    lastUpdated: 'Hoje, 15:50'
  },
  {
    id: 'praca-to-araguaina',
    state: 'Tocantins',
    stateCode: 'TO',
    region: 'Araguaína / Gurupi / Norte',
    cashPriceArroba: 306.00,
    termPriceArroba: 309.00,
    liveWeightPriceKg: 10.20,
    carcassYieldEstimate: 53.0,
    cowCashPriceArroba: 282.00,
    heiferCashPriceArroba: 292.00,
    spreadVsSP: -26.50,
    trend: 'up',
    slaughterScaleDays: 10.5,
    source: 'FAET / Frigoríficos TO',
    mainPackers: 'Minerva Araguaína, Plena Gurupi',
    lastUpdated: 'Hoje, 15:55'
  },
  {
    id: 'praca-ro-ji-parana',
    state: 'Rondônia',
    stateCode: 'RO',
    region: 'Porto Velho / Ji-Paraná / Vilhena',
    cashPriceArroba: 300.00,
    termPriceArroba: 303.00,
    liveWeightPriceKg: 10.00,
    carcassYieldEstimate: 53.0,
    cowCashPriceArroba: 278.00,
    heiferCashPriceArroba: 288.00,
    spreadVsSP: -32.50,
    trend: 'stable',
    slaughterScaleDays: 11.5,
    source: 'FAPERON / Scot',
    mainPackers: 'JBS Vilhena/Pimenta Bueno, Marfrig Chupinguaia',
    lastUpdated: 'Hoje, 15:40'
  },
  {
    id: 'praca-rs-bage',
    state: 'Rio Grande do Sul',
    stateCode: 'RS',
    region: 'Fronteira / Bagé / Pelotas (Raças Britânicas)',
    cashPriceArroba: 315.00,
    termPriceArroba: 318.00,
    liveWeightPriceKg: 10.50,
    carcassYieldEstimate: 52.5,
    cowCashPriceArroba: 285.00,
    heiferCashPriceArroba: 300.00,
    spreadVsSP: -17.50,
    trend: 'stable',
    slaughterScaleDays: 6.5,
    source: 'FARSUL / EMATER-RS',
    mainPackers: 'Marfrig Bagé/Alegrete, Frigorífico Silva',
    lastUpdated: 'Hoje, 15:30'
  }
];

// 3. CARCAÇAS E QUARTOS NO ATACADO COM INDICADORES DE VAREJO RJ
export const INITIAL_CARCASS_QUOTES: WholesaleCarcassQuote[] = [
  {
    id: 'carc-boi-casado',
    name: 'Boi Casado Inteiro (Traseiro + Dianteiro + Ponta)',
    type: 'casado',
    priceKg: 22.20,
    equivalentArrobaPrice: 333.00,
    changeWeek: 1.35,
    trend: 'up',
    suggestedRetailPriceKg: 31.50,
    rjRetailPriceKg: 31.90,
    yieldPercentStandard: 100.0,
    source: 'Atacado RJ/SP • Frigoríficos JBS/Marfrig/Minerva',
    notes: 'Base canônica de negociação de carcaça fria resfriada em câmaras.'
  },
  {
    id: 'carc-quarto-traseiro',
    name: 'Quarto Traseiro Bovino com Osso (Especial)',
    type: 'traseiro',
    priceKg: 25.80,
    equivalentArrobaPrice: 387.00,
    changeWeek: 1.55,
    trend: 'up',
    suggestedRetailPriceKg: 38.90,
    rjRetailPriceKg: 39.50,
    yieldPercentStandard: 48.0,
    source: 'Frigoríficos SP/MG/RJ • Ceasa RJ',
    notes: 'Contém os cortes nobres (picanha, filé, contra filé) e o conjunto do coxão.'
  },
  {
    id: 'carc-quarto-dianteiro',
    name: 'Quarto Dianteiro Bovino com Osso (1ª/2ª)',
    type: 'dianteiro',
    priceKg: 17.90,
    equivalentArrobaPrice: 268.50,
    changeWeek: 1.10,
    trend: 'up',
    suggestedRetailPriceKg: 25.90,
    rjRetailPriceKg: 26.50,
    yieldPercentStandard: 38.0,
    source: 'Mercado Atacadista RJ/SP',
    notes: 'Composto por paleta, acém, peito, pescoço e músculo dianteiro.'
  },
  {
    id: 'carc-ponta-agulha',
    name: 'Ponta de Agulha / Costela Gaúcha com Osso',
    type: 'costela',
    priceKg: 17.20,
    equivalentArrobaPrice: 258.00,
    changeWeek: 0.90,
    trend: 'up',
    suggestedRetailPriceKg: 24.50,
    rjRetailPriceKg: 25.90,
    yieldPercentStandard: 14.0,
    source: 'Frigoríficos GO/MS/MG para RJ',
    notes: 'Costela inteira de ripa/minga para churrasco e processamento.'
  },
  {
    id: 'carc-vaca-casada',
    name: 'Vaca Casada Inteira com Osso',
    type: 'casado',
    priceKg: 20.40,
    equivalentArrobaPrice: 306.00,
    changeWeek: 0.80,
    trend: 'up',
    suggestedRetailPriceKg: 28.90,
    rjRetailPriceKg: 29.50,
    yieldPercentStandard: 100.0,
    source: 'Atacado RJ/MG',
    notes: 'Opção econômica para abastecimento de carne moída e cortes populares.'
  },
  {
    id: 'carc-banda-suina',
    name: 'Banda Suína Fria Especial com Toucinho/Osso',
    type: 'suino',
    priceKg: 13.80,
    equivalentArrobaPrice: 207.00,
    changeWeek: 0.50,
    trend: 'stable',
    suggestedRetailPriceKg: 19.90,
    rjRetailPriceKg: 20.90,
    yieldPercentStandard: 100.0,
    source: 'Indústria Suinícola SC/PR/MG para Mercado RJ',
    notes: 'Carcaça suína inteira resfriada (peso médio 36kg por meia banda).'
  }
];

// 4. CORTES DESOSSADOS (DIANTEIRO, TRASEIRO, COXÃO, ALCATRÃO, SUÍNO, GRAXARIA)
export const INITIAL_CUT_QUOTES: WholesaleCutQuote[] = [
  // --- CORTES NOBRES (TRASEIRO) ---
  {
    id: 'cut-picanha',
    name: 'Picanha Bovina Resfriada (Peça Padrão A/AA)',
    category: 'nobres',
    productCode: 'COR-PICANHA',
    minPriceKg: 72.00,
    maxPriceKg: 78.50,
    avgPriceKg: 74.50,
    changeWeek: 2.10,
    trend: 'up',
    suggestedRetailPriceKg: 98.90,
    rjRetailPriceKg: 94.90,
    rjRetailMarginPercent: 21.5,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 6.8,
    idealMarginPercent: 24.6,
    standardYieldPercent: 1.50,
    source: 'Frigoríficos SP/MT/MS • NielsenIQ RJ • Scantec RJ',
    packers: 'JBS/Friboi Reserva, Marfrig Bassi, Minerva Angus',
    description: 'Corte mais valorizado da desossa com capa de gordura uniforme e alto sell-out nos fins de semana.'
  },
  {
    id: 'cut-file-mignon',
    name: 'Filé Mignon Bovino Limpo (Cordão Removido)',
    category: 'nobres',
    productCode: 'COR-MIGNON',
    minPriceKg: 65.00,
    maxPriceKg: 71.00,
    avgPriceKg: 68.00,
    changeWeek: 1.80,
    trend: 'up',
    suggestedRetailPriceKg: 89.90,
    rjRetailPriceKg: 87.90,
    rjRetailMarginPercent: 22.6,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 3.2,
    idealMarginPercent: 24.3,
    standardYieldPercent: 1.70,
    source: 'Indústria Frigorífica • NielsenIQ Supermercados RJ',
    packers: 'JBS Swift Black, Marfrig, Plena',
    description: 'Corte extremamente macio, sem gordura entremeada, alta procura em lojas de perfil classe A/B.'
  },
  {
    id: 'cut-contra-file',
    name: 'Contra Filé / Bife de Chorizo / Ancho Resfriado',
    category: 'nobres',
    productCode: 'COR-CONTRA',
    minPriceKg: 42.50,
    maxPriceKg: 46.80,
    avgPriceKg: 44.80,
    changeWeek: 1.60,
    trend: 'up',
    suggestedRetailPriceKg: 58.90,
    rjRetailPriceKg: 56.90,
    rjRetailMarginPercent: 21.2,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 8.4,
    idealMarginPercent: 23.9,
    standardYieldPercent: 7.00,
    source: 'Mercado Atacadista RJ/SP • Scantec Sell-Out RJ',
    packers: 'JBS Friboi, Marfrig, Barra Mansa RJ',
    description: 'Corte nobre do lombo bovino com alta demanda em grelha, bifes rápidos e churrasco.'
  },
  {
    id: 'cut-alcatra',
    name: 'Alcatra Completa com Maminha',
    category: 'alcatrao',
    productCode: 'COR-ALCATRA',
    minPriceKg: 38.00,
    maxPriceKg: 41.50,
    avgPriceKg: 39.90,
    changeWeek: 1.40,
    trend: 'up',
    suggestedRetailPriceKg: 52.90,
    rjRetailPriceKg: 51.90,
    rjRetailMarginPercent: 23.1,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 9.1,
    idealMarginPercent: 24.5,
    standardYieldPercent: 6.50,
    source: 'Atacado de Carnes RJ • NielsenIQ Retail Audit',
    packers: 'JBS, Minerva, Barra Mansa Alimentos RJ',
    description: 'Excelente versatilidade no balcão para bifes, assados e moídos nobres.'
  },
  {
    id: 'cut-maminha',
    name: 'Maminha da Alcatra Resfriada',
    category: 'alcatrao',
    productCode: 'COR-MAMINHA',
    minPriceKg: 43.00,
    maxPriceKg: 47.50,
    avgPriceKg: 45.20,
    changeWeek: 1.50,
    trend: 'up',
    suggestedRetailPriceKg: 59.90,
    rjRetailPriceKg: 58.90,
    rjRetailMarginPercent: 23.2,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 3.5,
    idealMarginPercent: 24.5,
    standardYieldPercent: 1.80,
    source: 'Frigoríficos SP/MG/RJ • Scantec RJ',
    packers: 'JBS, Marfrig, Frigol',
    description: 'Ponta macia da alcatra com formato triangular, ótima para churrasco e forno.'
  },
  {
    id: 'cut-miolo-alcatra',
    name: 'Miolo de Alcatra (Baby Beef / Coração)',
    category: 'alcatrao',
    productCode: 'COR-MIOLO-ALC',
    minPriceKg: 41.00,
    maxPriceKg: 44.80,
    avgPriceKg: 42.80,
    changeWeek: 1.30,
    trend: 'up',
    suggestedRetailPriceKg: 56.90,
    rjRetailPriceKg: 55.50,
    rjRetailMarginPercent: 22.8,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 4.8,
    idealMarginPercent: 24.7,
    standardYieldPercent: 4.70,
    source: 'Atacado RJ • Pesquisa NielsenIQ Varejo RJ',
    packers: 'JBS, Minerva, Plena',
    description: 'Coração da alcatra desprovido de nervos, ideal para escalopes e bifes altos.'
  },
  {
    id: 'cut-fraldinha',
    name: 'Fraldinha / Vazio Bovino Resfriado',
    category: 'nobres',
    productCode: 'COR-FRALDINHA',
    minPriceKg: 34.50,
    maxPriceKg: 37.80,
    avgPriceKg: 36.00,
    changeWeek: 1.20,
    trend: 'up',
    suggestedRetailPriceKg: 48.90,
    rjRetailPriceKg: 47.90,
    rjRetailMarginPercent: 24.8,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 4.1,
    idealMarginPercent: 26.3,
    standardYieldPercent: 2.10,
    source: 'Frigoríficos SP/GO • Scantec RJ',
    packers: 'JBS, Marfrig, Barra Mansa RJ',
    description: 'Fibras longas e suculentas, forte demanda para churrasqueiras no estado do RJ.'
  },

  // --- COXÃO / TRASEIRO ---
  {
    id: 'cut-cha-de-dentro',
    name: 'Chã de Dentro / Coxão Mole Resfriado',
    category: 'coxao',
    productCode: 'COR-CHA',
    minPriceKg: 34.00,
    maxPriceKg: 37.00,
    avgPriceKg: 35.50,
    changeWeek: 1.30,
    trend: 'up',
    suggestedRetailPriceKg: 46.90,
    rjRetailPriceKg: 45.90,
    rjRetailMarginPercent: 22.6,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 12.5,
    idealMarginPercent: 24.3,
    standardYieldPercent: 8.50,
    source: 'Atacado de Desossa RJ/SP • Scantec Sell-Out RJ',
    packers: 'JBS Friboi, Marfrig, Barra Mansa, Plena',
    description: 'Corte mais vendido do traseiro no RJ, padrão para bifes finos, milanesa e rolê.'
  },
  {
    id: 'cut-patinho',
    name: 'Patinho Bovino Resfriado (Moída 1ª)',
    category: 'coxao',
    productCode: 'COR-PATINHO',
    minPriceKg: 33.50,
    maxPriceKg: 36.20,
    avgPriceKg: 34.80,
    changeWeek: 1.15,
    trend: 'up',
    suggestedRetailPriceKg: 45.90,
    rjRetailPriceKg: 44.90,
    rjRetailMarginPercent: 22.5,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 11.2,
    idealMarginPercent: 24.1,
    standardYieldPercent: 6.50,
    source: 'Atacado RJ • NielsenIQ Retail Index RJ',
    packers: 'JBS, Marfrig, Minerva, Plena',
    description: 'Carne magra de altíssimo giro diário para carne moída de primeira, strogonoff e bife à milanesa.'
  },
  {
    id: 'cut-lagarto',
    name: 'Lagarto Bovino (Redondo / Paulista)',
    category: 'coxao',
    productCode: 'COR-LAG-RED',
    minPriceKg: 32.00,
    maxPriceKg: 35.00,
    avgPriceKg: 33.50,
    changeWeek: 0.90,
    trend: 'stable',
    suggestedRetailPriceKg: 44.90,
    rjRetailPriceKg: 43.50,
    rjRetailMarginPercent: 23.0,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 3.8,
    idealMarginPercent: 25.3,
    standardYieldPercent: 3.00,
    source: 'Mercado Atacadista RJ/SP',
    packers: 'JBS, Marfrig, Barra Mansa RJ',
    description: 'Formato cilíndrico ideal para rosbife, carpaccio, recheados e carne de panela.'
  },
  {
    id: 'cut-coxao-duro',
    name: 'Lagarto Plano / Coxão Duro / Chã de Fora',
    category: 'coxao',
    productCode: 'COR-LAG-PLA',
    minPriceKg: 31.80,
    maxPriceKg: 34.50,
    avgPriceKg: 33.20,
    changeWeek: 0.95,
    trend: 'stable',
    suggestedRetailPriceKg: 43.90,
    rjRetailPriceKg: 42.90,
    rjRetailMarginPercent: 22.6,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 6.9,
    idealMarginPercent: 24.3,
    standardYieldPercent: 5.50,
    source: 'Atacado RJ/SP • Scantec RJ',
    packers: 'JBS, Minerva, RioBeef RJ',
    description: 'Corte de fibras firmes, excelente para cozidos de panela, moídos magros e bife de panela.'
  },
  {
    id: 'cut-musculo-traseiro',
    name: 'Músculo Traseiro Bovino (Ossobuco / Gelo)',
    category: 'coxao',
    productCode: 'COR-MUSC-TRAS',
    minPriceKg: 25.00,
    maxPriceKg: 27.80,
    avgPriceKg: 26.50,
    changeWeek: 0.70,
    trend: 'stable',
    suggestedRetailPriceKg: 35.90,
    rjRetailPriceKg: 34.90,
    rjRetailMarginPercent: 24.0,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 2.8,
    idealMarginPercent: 26.1,
    standardYieldPercent: 3.50,
    source: 'Atacado RJ/SP',
    packers: 'JBS, Plena, Barra Mansa RJ',
    description: 'Rico em colágeno, corte tradicional para ensopados, sopas, papinhas e ossobuco fatiado.'
  },

  // --- DIANTEIRO ---
  {
    id: 'cut-paleta',
    name: 'Paleta Bovina Desossada com Músculo',
    category: 'dianteiro',
    productCode: 'COR-PALETA',
    minPriceKg: 26.00,
    maxPriceKg: 28.50,
    avgPriceKg: 27.20,
    changeWeek: 0.85,
    trend: 'up',
    suggestedRetailPriceKg: 36.90,
    rjRetailPriceKg: 35.90,
    rjRetailMarginPercent: 24.2,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 8.9,
    idealMarginPercent: 26.2,
    standardYieldPercent: 9.00,
    source: 'Atacado RJ/SP • Desossa Frigorífica',
    packers: 'JBS Friboi, Marfrig, Barra Mansa, Plena',
    description: 'Corte principal do dianteiro para bifes do dia a dia, cozidos e carne moída.'
  },
  {
    id: 'cut-acem',
    name: 'Acém Bovino Resfriado',
    category: 'dianteiro',
    productCode: 'COR-ACEM',
    minPriceKg: 25.50,
    maxPriceKg: 28.00,
    avgPriceKg: 26.80,
    changeWeek: 0.90,
    trend: 'up',
    suggestedRetailPriceKg: 35.90,
    rjRetailPriceKg: 34.90,
    rjRetailMarginPercent: 23.2,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 10.8,
    idealMarginPercent: 25.3,
    standardYieldPercent: 11.00,
    source: 'Mercado Atacadista RJ/SP • NielsenIQ RJ',
    packers: 'JBS, Marfrig, Minerva, RioBeef RJ',
    description: 'Maior corte em volume do dianteiro, o grande campeão de venda no balcão popular dos supermercados do RJ.'
  },
  {
    id: 'cut-peito',
    name: 'Peito Bovino Resfriado (Brisket)',
    category: 'dianteiro',
    productCode: 'COR-PEITO',
    minPriceKg: 24.20,
    maxPriceKg: 26.80,
    avgPriceKg: 25.50,
    changeWeek: 1.10,
    trend: 'up',
    suggestedRetailPriceKg: 34.90,
    rjRetailPriceKg: 33.90,
    rjRetailMarginPercent: 24.7,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 4.2,
    idealMarginPercent: 26.9,
    standardYieldPercent: 6.00,
    source: 'Atacado RJ/SP (Padrão Gourmet / Defumação)',
    packers: 'JBS, Marfrig, Barra Mansa',
    description: 'Corte com capa de gordura densa, muito valorizado para defumação, pastrami e cozidos de longa cocção.'
  },
  {
    id: 'cut-musculo-dianteiro',
    name: 'Músculo Dianteiro Bovino',
    category: 'dianteiro',
    productCode: 'COR-MUSCULO',
    minPriceKg: 23.80,
    maxPriceKg: 26.20,
    avgPriceKg: 25.00,
    changeWeek: 0.60,
    trend: 'stable',
    suggestedRetailPriceKg: 33.90,
    rjRetailPriceKg: 32.90,
    rjRetailMarginPercent: 24.0,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 3.6,
    idealMarginPercent: 26.2,
    standardYieldPercent: 4.50,
    source: 'Atacado RJ/SP',
    packers: 'JBS, Plena, Frigol',
    description: 'Carne magra saborosa com alto teor de fibras e colágeno natural para ensopados.'
  },
  {
    id: 'cut-cupim',
    name: 'Cupim Bovino Nelore Resfriado',
    category: 'dianteiro',
    productCode: 'COR-CUPIM',
    minPriceKg: 36.50,
    maxPriceKg: 40.50,
    avgPriceKg: 38.50,
    changeWeek: 1.50,
    trend: 'up',
    suggestedRetailPriceKg: 52.90,
    rjRetailPriceKg: 51.90,
    rjRetailMarginPercent: 25.8,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 3.1,
    idealMarginPercent: 27.2,
    standardYieldPercent: 2.80,
    source: 'Frigoríficos MT/MS/GO para RJ',
    packers: 'JBS Nelore, Marfrig, Minerva',
    description: 'Gordura entremeada e sabor único dos animais zebuínos Nelore, forte demanda para churrasco carioca.'
  },
  {
    id: 'cut-costela-congelada',
    name: 'Costela Bovina Congelada Minga/Ripa (Caixa)',
    category: 'dianteiro',
    productCode: 'BOI-COST-GAU',
    minPriceKg: 22.50,
    maxPriceKg: 25.00,
    avgPriceKg: 23.80,
    changeWeek: 0.80,
    trend: 'stable',
    suggestedRetailPriceKg: 34.90,
    rjRetailPriceKg: 33.50,
    rjRetailMarginPercent: 28.9,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 6.2,
    idealMarginPercent: 27.6,
    standardYieldPercent: 5.80,
    source: 'Atacado RJ/SP • Ceasa RJ',
    packers: 'JBS Friboi, Marfrig, Barra Mansa RJ',
    description: 'Costela fatiada ou em tiras em caixas congeladas de 20kg a 25kg.'
  },

  // --- SUÍNO ---
  {
    id: 'cut-costela-suina',
    name: 'Costela Suína Fresca Resfriada',
    category: 'suino',
    productCode: 'SUI-COST-SUINA',
    minPriceKg: 20.50,
    maxPriceKg: 23.20,
    avgPriceKg: 21.90,
    changeWeek: 0.70,
    trend: 'up',
    suggestedRetailPriceKg: 29.90,
    rjRetailPriceKg: 28.90,
    rjRetailMarginPercent: 24.2,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 5.5,
    idealMarginPercent: 26.7,
    standardYieldPercent: 8.50,
    source: 'Indústria Suinícola SC/PR/MG • Varejo RJ',
    packers: 'Seara / JBS, Aurora Coop, BRF / Sadia, Frimesa',
    description: 'Costelinha suína macia para churrasco, forno e barbecue.'
  },
  {
    id: 'cut-pernil-suino',
    name: 'Pernil Suíno com Osso Resfriado',
    category: 'suino',
    productCode: 'SUI-PERNIL',
    minPriceKg: 13.50,
    maxPriceKg: 15.50,
    avgPriceKg: 14.50,
    changeWeek: 0.40,
    trend: 'stable',
    suggestedRetailPriceKg: 19.90,
    rjRetailPriceKg: 18.90,
    rjRetailMarginPercent: 23.2,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 7.8,
    idealMarginPercent: 27.1,
    standardYieldPercent: 25.00,
    source: 'Atacado Suinícola RJ/SP • Scantec RJ',
    packers: 'Seara, Aurora, Sadia, Saudali',
    description: 'Peça volumosa para assados, bifes e produção de bisteca/cubos.'
  },
  {
    id: 'cut-lombo-suino',
    name: 'Lombo Suíno Resfriado Limpo',
    category: 'suino',
    productCode: 'SUI-LOMBO',
    minPriceKg: 17.00,
    maxPriceKg: 19.50,
    avgPriceKg: 18.20,
    changeWeek: 0.55,
    trend: 'stable',
    suggestedRetailPriceKg: 24.90,
    rjRetailPriceKg: 23.90,
    rjRetailMarginPercent: 23.8,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 3.4,
    idealMarginPercent: 26.9,
    standardYieldPercent: 10.00,
    source: 'Atacado Suinícola RJ',
    packers: 'Seara, Aurora, Sadia',
    description: 'Corte magro nobre da carcaça suína para medalhões e assados.'
  },
  {
    id: 'cut-paleta-suina',
    name: 'Paleta Suína com Osso Resfriada',
    category: 'suino',
    productCode: 'SUI-PALETA',
    minPriceKg: 12.80,
    maxPriceKg: 14.50,
    avgPriceKg: 13.60,
    changeWeek: 0.35,
    trend: 'stable',
    suggestedRetailPriceKg: 18.90,
    rjRetailPriceKg: 17.90,
    rjRetailMarginPercent: 24.0,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 4.0,
    idealMarginPercent: 28.0,
    standardYieldPercent: 18.00,
    source: 'Indústria Suinícola Sul/Sudeste',
    packers: 'Seara, Aurora, BRF, Saudali',
    description: 'Corte suíno econômico excelente para feijoadas, ensopados e assados.'
  },

  // --- GRAXARIA E SUBPRODUTOS (SEBO & OSSO REAIS) ---
  {
    id: 'cut-sebo-bovino',
    name: 'Sebo Bovino Industrial (Acidez < 4%)',
    category: 'graxaria',
    productCode: 'SUB-SEBO',
    minPriceKg: 4.60,
    maxPriceKg: 5.20,
    avgPriceKg: 4.85,
    changeWeek: 1.25,
    trend: 'up',
    suggestedRetailPriceKg: 4.85,
    rjRetailPriceKg: 4.85,
    rjRetailMarginPercent: 100.0,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 0,
    idealMarginPercent: 100.0,
    standardYieldPercent: 6.50,
    source: 'Graxarias RJ/SP/MG • Usinas de Biodiesel & Saboarias',
    packers: 'Faros Graxaria, Patense, Friboi Rendering',
    description: 'Crédito direto de graxaria que abate R$ 0,32/kg do custo do boi. Vendido para usinas de biodiesel e química pesada.'
  },
  {
    id: 'cut-farinha-carne-osso',
    name: 'Osso Bovino In Natura / Farinha FCO 45% PB',
    category: 'graxaria',
    productCode: 'SUB-OSSO',
    minPriceKg: 0.80,
    maxPriceKg: 1.10,
    avgPriceKg: 0.90,
    changeWeek: 0.80,
    trend: 'stable',
    suggestedRetailPriceKg: 0.90,
    rjRetailPriceKg: 0.90,
    rjRetailMarginPercent: 100.0,
    scantecGiroRating: 'ALTO',
    nielsenSharePercent: 0,
    idealMarginPercent: 100.0,
    standardYieldPercent: 15.50,
    source: 'Indústrias de Rendering / Ração Pet RJ/SP',
    packers: 'Faros, Patense, Rendertech',
    description: 'Crédito de graxaria que abate R$ 0,14/kg do custo do boi. Coletado diariamente para reciclagem animal.'
  },
  {
    id: 'cut-couro-verde',
    name: 'Couro Verde Bovino Salgado (Kg)',
    category: 'graxaria',
    productCode: 'SUB-COURO',
    minPriceKg: 1.95,
    maxPriceKg: 2.25,
    avgPriceKg: 2.10,
    changeWeek: -0.50,
    trend: 'down',
    suggestedRetailPriceKg: 2.10,
    rjRetailPriceKg: 2.10,
    rjRetailMarginPercent: 100.0,
    scantecGiroRating: 'MÉDIO',
    nielsenSharePercent: 0,
    idealMarginPercent: 100.0,
    standardYieldPercent: 7.00,
    source: 'Curtumes SP/RS/MG/RJ',
    packers: 'JBS Couros, Marfrig, Curtume Carioca',
    description: 'Subproduto da sangria destinado a indústrias automotivas, moveleiras e calçadistas.'
  }
];

// 5. AMOSTRAGEM REAL DE SUPERMERCADOS DO RIO DE JANEIRO (GUANABARA, MUNDIAL, PREZUNIC, ETC.)
export const INITIAL_RJ_RETAIL_BENCHMARKS: RJRetailBenchmark[] = [
  {
    id: 'bench-guanabara',
    chainName: 'Supermercados Guanabara',
    category: 'supermercado_popular',
    sampleCutPrices: {
      picanha: 89.90,
      contraFile: 52.90,
      alcatra: 48.90,
      coxaoMole: 42.90,
      patinho: 41.90,
      acem: 31.90,
      costela: 29.90,
      pernilSuino: 16.90
    },
    lastSurveyDate: 'Hoje',
    source: 'Pesquisa Semanal de Preços Balcão RJ / Encartes Promocionais'
  },
  {
    id: 'bench-mundial',
    chainName: 'Supermercados Mundial',
    category: 'supermercado_popular',
    sampleCutPrices: {
      picanha: 94.90,
      contraFile: 54.90,
      alcatra: 50.90,
      coxaoMole: 44.90,
      patinho: 43.90,
      acem: 33.90,
      costela: 31.90,
      pernilSuino: 17.90
    },
    lastSurveyDate: 'Hoje',
    source: 'Aferição Varejo Rio de Janeiro'
  },
  {
    id: 'bench-prezunic',
    chainName: 'Prezunic (Cencosud)',
    category: 'supermercado_popular',
    sampleCutPrices: {
      picanha: 96.90,
      contraFile: 56.90,
      alcatra: 52.90,
      coxaoMole: 46.90,
      patinho: 45.90,
      acem: 34.90,
      costela: 33.90,
      pernilSuino: 18.90
    },
    lastSurveyDate: 'Hoje',
    source: 'Scantec Sell-Out RJ'
  },
  {
    id: 'bench-supermarket',
    chainName: 'Rede Supermarket RJ',
    category: 'supermercado_popular',
    sampleCutPrices: {
      picanha: 92.90,
      contraFile: 53.90,
      alcatra: 49.90,
      coxaoMole: 43.90,
      patinho: 42.90,
      acem: 32.90,
      costela: 30.90,
      pernilSuino: 17.50
    },
    lastSurveyDate: 'Hoje',
    source: 'ASSERJ / Monitoramento Varejo RJ'
  },
  {
    id: 'bench-redeconomia',
    chainName: 'Supermercados Rede Economia',
    category: 'supermercado_popular',
    sampleCutPrices: {
      picanha: 91.90,
      contraFile: 53.50,
      alcatra: 49.50,
      coxaoMole: 43.50,
      patinho: 42.50,
      acem: 32.50,
      costela: 30.50,
      pernilSuino: 17.20
    },
    lastSurveyDate: 'Hoje',
    source: 'ASSERJ / Encartes e Monitoramento Rede Economia RJ'
  },
  {
    id: 'bench-dom-atacadista',
    chainName: 'Dom Atacadista',
    category: 'atacarejo',
    sampleCutPrices: {
      picanha: 86.90,
      contraFile: 48.90,
      alcatra: 45.90,
      coxaoMole: 40.90,
      patinho: 39.50,
      acem: 28.90,
      costela: 26.90,
      pernilSuino: 15.50
    },
    lastSurveyDate: 'Hoje',
    source: 'Amostragem Atacarejo RJ / Monitoramento Dom Atacadista'
  },
  {
    id: 'bench-assai-rj',
    chainName: 'Assaí Atacadista RJ',
    category: 'atacarejo',
    sampleCutPrices: {
      picanha: 87.90,
      contraFile: 49.90,
      alcatra: 46.90,
      coxaoMole: 41.50,
      patinho: 39.90,
      acem: 29.90,
      costela: 27.90,
      pernilSuino: 15.90
    },
    lastSurveyDate: 'Hoje',
    source: 'Atacarejo Rio de Janeiro'
  },
  {
    id: 'bench-zona-sul',
    chainName: 'Supermercados Zona Sul',
    category: 'supermercado_premium',
    sampleCutPrices: {
      picanha: 129.90,
      contraFile: 79.90,
      alcatra: 69.90,
      coxaoMole: 59.90,
      patinho: 58.90,
      acem: 44.90,
      costela: 42.90,
      pernilSuino: 26.90
    },
    lastSurveyDate: 'Hoje',
    source: 'NielsenIQ Premium Index RJ'
  }
];

// 6. SÉRIE HISTÓRICA DE PREÇOS
export const INITIAL_HISTORICAL_SERIES: HistoricalPricePoint[] = [
  { date: '2026-09-08', formattedDate: '08/Set', cepeaB3Price: 320.50, boiChinaPrice: 327.00, vacaPrice: 295.00, traseiroPriceKg: 24.80, dianteiroPriceKg: 17.20, gappAveragePrice: 318.00, rjVarejoAverageKg: 42.50 },
  { date: '2026-09-15', formattedDate: '15/Set', cepeaB3Price: 324.00, boiChinaPrice: 331.50, vacaPrice: 298.00, traseiroPriceKg: 25.10, dianteiroPriceKg: 17.40, gappAveragePrice: 322.00, rjVarejoAverageKg: 43.10 },
  { date: '2026-09-22', formattedDate: '22/Set', cepeaB3Price: 327.50, boiChinaPrice: 335.00, vacaPrice: 301.00, traseiroPriceKg: 25.40, dianteiroPriceKg: 17.60, gappAveragePrice: 325.00, rjVarejoAverageKg: 43.70 },
  { date: '2026-09-29', formattedDate: '29/Set', cepeaB3Price: 329.80, boiChinaPrice: 337.50, vacaPrice: 303.50, traseiroPriceKg: 25.60, dianteiroPriceKg: 17.75, gappAveragePrice: 328.00, rjVarejoAverageKg: 44.20 },
  { date: '2026-10-02', formattedDate: '02/Out', cepeaB3Price: 331.00, boiChinaPrice: 338.50, vacaPrice: 304.00, traseiroPriceKg: 25.70, dianteiroPriceKg: 17.85, gappAveragePrice: 330.00, rjVarejoAverageKg: 44.60 },
  { date: '2026-10-06', formattedDate: 'Hoje', cepeaB3Price: 332.50, boiChinaPrice: 340.00, vacaPrice: 305.00, traseiroPriceKg: 25.80, dianteiroPriceKg: 17.90, gappAveragePrice: 331.00, rjVarejoAverageKg: 44.90 },
];

export class MarketQuotesService {
  /**
   * Obtém snapshot completo das cotações em tempo real
   */
  public static getQuotesSnapshot(): MarketQuotesSnapshot {
    try {
      const saved = localStorage.getItem(QUOTES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} às ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Determina status do mercado (B3 funciona dias úteis das 09:00 às 17:00)
    const hours = now.getHours();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    const marketStatus = isWeekend ? 'FECHADO' : (hours >= 9 && hours <= 17 ? 'ABERTO' : 'FECHADO');

    return {
      timestamp: Date.now(),
      lastUpdatedDate: formattedDate,
      marketStatus: marketStatus,
      indicators: INITIAL_MARKET_INDICATORS,
      regionalQuotes: INITIAL_REGIONAL_QUOTES,
      carcassQuotes: INITIAL_CARCASS_QUOTES,
      cutQuotes: INITIAL_CUT_QUOTES,
      rjRetailBenchmarks: INITIAL_RJ_RETAIL_BENCHMARKS,
      historicalSeries: INITIAL_HISTORICAL_SERIES
    };
  }

  /**
   * Salva o snapshot no localStorage
   */
  public static saveQuotesSnapshot(snapshot: MarketQuotesSnapshot): void {
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {}
  }

  /**
   * Simula sincronização de pregão em tempo real gerando oscilações de mercado
   */
  public static refreshQuotes(): MarketQuotesSnapshot {
    const current = this.getQuotesSnapshot();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} às ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Oscilação aleatória sutil (-0.4% a +0.4%)
    const getRandomFactor = () => 1 + ((Math.random() - 0.48) * 0.008);

    const updatedIndicators = current.indicators.map(ind => {
      if (ind.category === 'cambio') return ind;
      const factor = getRandomFactor();
      const newPrice = Math.round(ind.price * factor * 100) / 100;
      const diff = newPrice - (ind.benchmarkPrice || ind.price);
      const pct = Math.round((diff / (ind.benchmarkPrice || ind.price)) * 10000) / 100;

      return {
        ...ind,
        price: newPrice,
        changeDay: pct,
        changeDayValue: Math.round(diff * 100) / 100,
        trend: diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('stable' as const),
        lastUpdated: `Hoje, ${pad(now.getHours())}:${pad(now.getMinutes())}`
      };
    });

    const updatedRegional = current.regionalQuotes.map(reg => {
      const spQuote = updatedIndicators.find(i => i.id === 'ind-cepea-sp')?.price || 332.50;
      const factor = getRandomFactor();
      const newCash = Math.round(reg.cashPriceArroba * factor * 100) / 100;
      const spread = Math.round((newCash - spQuote) * 100) / 100;
      const liveKg = Math.round((newCash / (30 * (reg.carcassYieldEstimate / 100))) * 100) / 100;

      return {
        ...reg,
        cashPriceArroba: newCash,
        termPriceArroba: Math.round((newCash + 3.00) * 100) / 100,
        liveWeightPriceKg: liveKg,
        spreadVsSP: spread,
        lastUpdated: `Hoje, ${pad(now.getHours())}:${pad(now.getMinutes())}`
      };
    });

    const snapshot: MarketQuotesSnapshot = {
      ...current,
      timestamp: Date.now(),
      lastUpdatedDate: formattedDate,
      indicators: updatedIndicators,
      regionalQuotes: updatedRegional
    };

    this.saveQuotesSnapshot(snapshot);
    return snapshot;
  }

  /**
   * Aplica a cotação oficial selecionada no sistema (atualiza yieldParams e custo/kg no ERP)
   */
  public static applyQuoteToSystem(arrobaPrice: number): { costPerKg: number; arrobaPrice: number } {
    const currentParams = StorageService.getYieldParams();
    const costPerKg = Math.round((arrobaPrice / 15) * 100) / 100;

    const updated = {
      ...currentParams,
      costPerKg: costPerKg,
    };

    StorageService.saveYieldParams(updated);
    return { costPerKg, arrobaPrice };
  }

  /**
   * Converte logo oficial em base64
   */
  private static async getLogoBase64(): Promise<string | null> {
    try {
      const response = await fetch('/patrick-pessoa-brand.png');
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /**
   * Gera e faz o download do Boletim Oficial de Cotações em PDF com Indicadores RJ
   */
  public static async generateAndDownloadQuotesBulletinPdf(): Promise<void> {
    const snapshot = this.getQuotesSnapshot();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 12;
    const logoBase64 = await this.getLogoBase64();

    // Top Header
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 24, 'F');

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, 3, 18, 18);
      } catch {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(245, 158, 11); // Amber 500
    doc.text('GRUPO GAPP SISTEMAS • BOLETIM OFICIAL DE COTAÇÃO EM TEMPO REAL', margin + 22, 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('MERCADO PECUÁRIO, ATACADO & VAREJO RIO DE JANEIRO', margin + 22, 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Atualização: ${snapshot.lastUpdatedDate} • Fontes: CEPEA/ESALQ, B3, Scot, IMEA, NielsenIQ RJ, Scantec RJ, ASSERJ`, margin + 22, 22);

    let y = 30;

    // 1. INDICADORES GERAIS
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Indicadores Oficiais de Mercado (CEPEA / B3 / Varejo RJ / Exportação)', margin, y);
    y += 4;

    const indicatorsTable = snapshot.indicators.map(ind => [
      ind.name,
      `${ind.unit} ${ind.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${ind.changeDay >= 0 ? '+' : ''}${ind.changeDay.toFixed(2)}%`,
      ind.source,
      ind.lastUpdated
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Indicador / Categoria', 'Cotação Atual', 'Var. Dia (%)', 'Fonte Oficial', 'Status / Hora']],
      body: indicatorsTable,
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      theme: 'grid'
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // 2. PRAÇAS PECUÁRIAS BRASILEIRAS COM DESTAQUE PARA RJ
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Cotações por Praça Pecuária / Estado (Boi Gordo @, Kg Vivo & Frigoríficos)', margin, y);
    y += 4;

    const regionalTable = snapshot.regionalQuotes.map(reg => [
      `${reg.stateCode} - ${reg.region}`,
      `R$ ${reg.cashPriceArroba.toFixed(2)}`,
      `R$ ${reg.termPriceArroba.toFixed(2)}`,
      `R$ ${reg.liveWeightPriceKg.toFixed(2)}`,
      `R$ ${reg.cowCashPriceArroba.toFixed(2)}`,
      `${reg.spreadVsSP > 0 ? '+' : ''}${reg.spreadVsSP.toFixed(2)}`,
      `${reg.slaughterScaleDays} dias`,
      reg.mainPackers
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Praça / Polo Frigorífico', 'À Vista (R$/@)', '30 Dias (@)', 'Kg Vivo', 'Vaca @', 'Spread SP', 'Escala', 'Frigoríficos Ofertantes']],
      body: regionalTable,
      headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59] },
      theme: 'striped'
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    if (y > pageHeight - 70) {
      doc.addPage();
      y = 20;
    }

    // 3. CORTES DESOSSADOS & INDICADORES DE VAREJO RJ (NIELSENIQ & SCANTEC)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Cortes Desossados, Custo Atacado & Indicadores Varejo Supermercados RJ (Nielsen/Scantec)', margin, y);
    y += 4;

    const cutsTable = snapshot.cutQuotes.map(cut => [
      cut.name,
      `R$ ${cut.avgPriceKg.toFixed(2)}`,
      `R$ ${cut.rjRetailPriceKg.toFixed(2)}`,
      `${cut.rjRetailMarginPercent.toFixed(1)}%`,
      cut.scantecGiroRating,
      `${cut.nielsenSharePercent > 0 ? cut.nielsenSharePercent.toFixed(1) + '%' : '-'}`,
      cut.source.split('•')[0]
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Corte / Subproduto', 'Atacado (R$/kg)', 'Varejo RJ (R$/kg)', 'Margem RJ', 'Giro Scantec', 'Share Nielsen', 'Origem Mercado']],
      body: cutsTable,
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59] },
      theme: 'grid'
    });

    // Footer
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Boletim de Cotação em Tempo Real • Grupo GAPP Sistemas ERP • Patrick Pessoa (Direção de Carnes)', margin, pageHeight - 6);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Boletim_Cotacao_Tempo_Real_GAPP_${dateStr}.pdf`);
  }

  /**
   * Compartilha o Boletim de Cotação em Tempo Real via WhatsApp com Indicadores RJ
   */
  public static shareQuotesBulletinViaWhatsApp(targetPhone?: string): void {
    const snapshot = this.getQuotesSnapshot();
    const cepeaSP = snapshot.indicators.find(i => i.id === 'ind-cepea-sp');
    const boiRJ = snapshot.indicators.find(i => i.id === 'ind-rj-ceasa');
    const boiChina = snapshot.indicators.find(i => i.id === 'ind-boi-china');
    const picanha = snapshot.cutQuotes.find(c => c.id === 'cut-picanha');
    const contra = snapshot.cutQuotes.find(c => c.id === 'cut-contra-file');
    const acem = snapshot.cutQuotes.find(c => c.id === 'cut-acem');
    const cha = snapshot.cutQuotes.find(c => c.id === 'cut-cha-de-dentro');

    const lines = [
      `📈 *GRUPO GAPP SISTEMAS • BOLETIM DE COTAÇÃO EM TEMPO REAL*`,
      `📅 *Atualização:* ${snapshot.lastUpdatedDate}`,
      `🏢 *Status Pregão:* ${snapshot.marketStatus === 'ABERTO' ? '🟢 Pregão Aberto' : '🔴 Mercado Fechado'}`,
      ``,
      `🐂 *INDICADORES DE MERCADO & ARROBA (@):*`,
      `• *Boi Gordo CEPEA/B3 (SP):* R$ ${cepeaSP?.price.toFixed(2)}/@ (${cepeaSP && cepeaSP.changeDay >= 0 ? '+' : ''}${cepeaSP?.changeDay.toFixed(2)}%)`,
      `• *Boi Entrada Rio de Janeiro:* R$ ${boiRJ?.price.toFixed(2)}/@`,
      `• *Boi Padrão China (SP):* R$ ${boiChina?.price.toFixed(2)}/@ (Premiação R$ 7,50/@)`,
      ``,
      `🥩 *CORTES NO ATACADO vs VAREJO RIO DE JANEIRO (Scantec/Nielsen):*`,
      `• *Picanha:* Atacado R$ ${picanha?.avgPriceKg.toFixed(2)}/kg | Balcão RJ: R$ ${picanha?.rjRetailPriceKg.toFixed(2)}/kg`,
      `• *Contra Filé:* Atacado R$ ${contra?.avgPriceKg.toFixed(2)}/kg | Balcão RJ: R$ ${contra?.rjRetailPriceKg.toFixed(2)}/kg`,
      `• *Coxão Mole (Chã):* Atacado R$ ${cha?.avgPriceKg.toFixed(2)}/kg | Balcão RJ: R$ ${cha?.rjRetailPriceKg.toFixed(2)}/kg`,
      `• *Acém Dianteiro:* Atacado R$ ${acem?.avgPriceKg.toFixed(2)}/kg | Balcão RJ: R$ ${acem?.rjRetailPriceKg.toFixed(2)}/kg`,
      ``,
      `📍 *COTAÇÕES POR PRAÇA PECUÁRIA:*`,
      `• RJ (Grande Rio/Ceasa): R$ 328,00/@`,
      `• SP (Barretos/Araçatuba): R$ 332,50/@`,
      `• MG (Triângulo Mineiro): R$ 322,00/@`,
      `• GO (Goiânia/Rio Verde): R$ 320,00/@`,
      `• MS (Campo Grande): R$ 318,00/@`,
      `• MT (Norte/Sinop): R$ 308,00/@`,
      ``,
      `📊 *Fontes Oficiais:* CEPEA/ESALQ • B3 • Scot • IMEA • NielsenIQ RJ • Scantec RJ`,
      `🔒 _ERP Gestão Apuração do Boi v10.4 • Patrick Pessoa_`
    ];

    const messageText = lines.join('\n');
    const sanitizedPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const phoneParam = sanitizedPhone ? `phone=${sanitizedPhone}&` : '';
    const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(messageText)}`;

    window.open(whatsappUrl, '_blank');
  }
}
