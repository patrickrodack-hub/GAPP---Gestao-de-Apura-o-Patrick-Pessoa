import {
  DesossaCategoryGroup,
  PdfSalesCategorySummary,
  PdfSalesParsedCutItem,
  SheetRowData,
  SlaughterhouseCategoryStandard,
  SlaughterhouseCategoryStock,
  SlaughterhouseCutCategory,
  SlaughterhouseOrderDraft,
  SlaughterhouseOrderReportRow,
  SlaughterhouseSalesEntry,
  SlaughterhouseStoreOrderRow,
  SlaughterhouseStoreStock,
  Store,
  Supplier,
  YieldParams,
} from '../types/erp';
import {
  DEFAULT_CUT_YIELD_WEIGHTS,
  DEFAULT_MESA_CARCASS_PERCENTS,
  DEFAULT_MESA_COST_FACTORS,
  getCutYieldWeightsFromSimulation,
} from './calculationService';

export const SLAUGHTERHOUSE_CATEGORY_ORDER: SlaughterhouseCutCategory[] = [
  'dianteiro',
  'traseiro',
  'coxao',
  'alcatrao',
  'costela',
];

export const SLAUGHTERHOUSE_CATEGORY_META: Record<
  SlaughterhouseCutCategory,
  {
    label: string;
    shortLabel: string;
    desossaGroup: DesossaCategoryGroup;
    desossaDescription: string;
    includedCutsLabel: string;
    mesaCode: string;
    defaultWeightKg: number;
  }
> = {
  dianteiro: {
    label: 'Dianteiro',
    shortLabel: 'Diant.',
    desossaGroup: 'SEGUNDA',
    desossaDescription: 'Segunda (Paleta, Acém, Peito, Músculo)',
    includedCutsLabel: 'Paleta, Acém, Peito Bovino, Músculo, Raquete, Peixinho',
    mesaCode: 'BOI-DIANT',
    defaultWeightKg: 45, // Padrão explícito informado na regra de cálculo
  },
  traseiro: {
    label: 'Traseiro',
    shortLabel: 'Tras.',
    desossaGroup: 'TRASEIRO',
    desossaDescription: 'Nobre + Coxão (Traseiro Especial)',
    includedCutsLabel: 'Alcatrão (Nobre) + Coxão + Traseiro Câmara',
    mesaCode: 'BOI-TRAS',
    defaultWeightKg: 60,
  },
  coxao: {
    label: 'Coxão',
    shortLabel: 'Coxão',
    desossaGroup: 'COXAO',
    desossaDescription: 'Coxão (Perna Traseira)',
    includedCutsLabel: 'Chã de Dentro (Coxão Mole), Patinho, Lagarto Redondo, Lagarto Plano (Coxão Duro)',
    mesaCode: 'BOI-COXAO',
    defaultWeightKg: 35,
  },
  alcatrao: {
    label: 'Alcatrão',
    shortLabel: 'Alcat.',
    desossaGroup: 'NOBRE',
    desossaDescription: 'Nobre (Lombo / Grelha)',
    includedCutsLabel: 'Alcatra c/ Maminha, Contra Filé, Picanha, Filé Mignon',
    mesaCode: 'BOI-ALCAT',
    defaultWeightKg: 22,
  },
  costela: {
    label: 'Costela',
    shortLabel: 'Cost.',
    desossaGroup: 'COSTELA',
    desossaDescription: 'Costela / Ponta de Agulha',
    includedCutsLabel: 'Costela Gaúcha, Ponta de Agulha, Costela Congelada / Minga / Ripa',
    mesaCode: 'BOI-COST-GAU',
    defaultWeightKg: 20,
  },
};

export function normalizeTextForClassification(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classifica um corte bovino utilizando a base do módulo Desossa:
 * - Dianteiro ("segunda"): Paleta, Acém, Peito, Músculo, Cupim, Peixinho, Raquete, Capa de Filé...
 * - Alcatrão ("nobre"): Picanha, Filé Mignon, Contra Filé, Alcatra, Maminha, Ancho, Chorizo...
 * - Coxão ("coxao"): Chã de Dentro, Coxão Mole, Patinho, Lagarto Redondo, Coxão Duro, Posta...
 * - Costela ("costela"): Costela Gaúcha, Ponta de Agulha, Costela Ripa, Costela Minga...
 * - Traseiro ("nobre+coxao"): Peça Traseiro / Serrote / Traseiro Especial
 */
export function classifyBeefCut(
  cutName: string,
  rawCategory?: string
): {
  category: SlaughterhouseCutCategory;
  desossaGroup: DesossaCategoryGroup;
  matchedBy: string;
} {
  const normName = normalizeTextForClassification(cutName);
  const normCat = normalizeTextForClassification(rawCategory || '');
  const combined = `${normName} ${normCat}`.trim();

  // 1. Costela (COSTELA)
  const costelaKeywords = [
    'costela gaucha',
    'costela cong',
    'costela minga',
    'costela ripa',
    'costela bovina',
    'costela c/ osso',
    'costela com osso',
    'costela do dianteiro',
    'ponta de agulha',
    'costela ponta',
    'costela',
    'janela costela',
    'tira de costela',
  ];
  for (const kw of costelaKeywords) {
    if (combined.includes(kw)) {
      return { category: 'costela', desossaGroup: 'COSTELA', matchedBy: `Desossa Costela (${kw})` };
    }
  }

  // 2. Alcatrão / Cortes Nobres (NOBRE)
  const nobreKeywords = [
    'picanha',
    'file mignon',
    'mignon',
    'contra file',
    'contrafile',
    'contra-file',
    'alcatra',
    'alcatrao',
    'maminha',
    'bombom da alcatra',
    'miolo de alcatra',
    'bife ancho',
    'ancho',
    'chorizo',
    'entrecote',
    't-bone',
    'tbone',
    'nobre',
  ];
  for (const kw of nobreKeywords) {
    if (combined.includes(kw)) {
      return { category: 'alcatrao', desossaGroup: 'NOBRE', matchedBy: `Desossa Nobre (${kw})` };
    }
  }

  // 3. Coxão (COXAO)
  const coxaoKeywords = [
    'cha de dentro',
    'cha dentro',
    'cha de fora',
    'cha fora',
    'coxao mole',
    'coxao duro',
    'patinho',
    'lagarto redondo',
    'lagarto plano',
    'lagarto paulista',
    'lagarto',
    'posta branca',
    'posta vermelha',
    'coxao',
    'paulista',
    'chã',
  ];
  for (const kw of coxaoKeywords) {
    if (combined.includes(normalizeTextForClassification(kw))) {
      return { category: 'coxao', desossaGroup: 'COXAO', matchedBy: `Desossa Coxão (${kw})` };
    }
  }

  // 4. Dianteiro / Segunda (SEGUNDA)
  const dianteiroKeywords = [
    'paleta',
    'acem',
    'peito bovino',
    'peito c/ osso',
    'peito com osso',
    'ponta de peito',
    'peito',
    'musculo',
    'dianteiro',
    'raquete',
    'peixinho',
    'miolo da paleta',
    'capa de file',
    'capa do file',
    'bananinha',
    'cupim',
    'pescoco',
    'braço',
    'braco',
    'carne de segunda',
    'segunda',
    'moida dianteiro',
  ];
  for (const kw of dianteiroKeywords) {
    if (combined.includes(kw)) {
      return { category: 'dianteiro', desossaGroup: 'SEGUNDA', matchedBy: `Desossa Segunda (${kw})` };
    }
  }

  // 5. Traseiro (NOBRE + COXAO) explícito
  const traseiroKeywords = [
    'traseiro',
    'serrote',
    'traseiro especial',
    'quarto traseiro',
    'pistola',
  ];
  for (const kw of traseiroKeywords) {
    if (combined.includes(kw)) {
      return { category: 'traseiro', desossaGroup: 'TRASEIRO', matchedBy: `Desossa Traseiro (${kw})` };
    }
  }

  // Fallback por categoria textual genérica
  if (normCat.includes('primeira') || normCat.includes('traseir')) {
    return { category: 'traseiro', desossaGroup: 'TRASEIRO', matchedBy: 'Categoria genérica Traseiro' };
  }

  return { category: 'dianteiro', desossaGroup: 'SEGUNDA', matchedBy: 'Classificação padrão Segunda (revisável)' };
}

/**
 * Constrói os parâmetros padrão das 5 categorias a partir das configurações da Desossa.
 * Mantém Dianteiro = 45kg por padrão conforme regra operacional ("Padrão do dianteiro 45kg"),
 * ou recalcula 100% via % carcaça da Desossa quando `useExactDesossaWeights = true`.
 */
export function buildSlaughterhouseStandardsFromDesossa(
  yieldParams?: Partial<YieldParams> | null,
  useExactDesossaWeights: boolean = false
): Record<SlaughterhouseCutCategory, SlaughterhouseCategoryStandard> {
  const carcassWeight = Number(yieldParams?.carcassWeight || 240);
  const baseBoiCostKg = Number(yieldParams?.costPerKg || 26.0);
  const percents = yieldParams?.mesaCarcassPercents || DEFAULT_MESA_CARCASS_PERCENTS;
  const factors = yieldParams?.mesaCostFactors || DEFAULT_MESA_COST_FACTORS;

  const getCost = (mesaCode: string, explicitOverride?: number) => {
    if (explicitOverride && explicitOverride > 0) return Number(explicitOverride.toFixed(2));
    const f = factors[mesaCode] ?? DEFAULT_MESA_COST_FACTORS[mesaCode] ?? 1;
    return Number((baseBoiCostKg * f).toFixed(2));
  };

  const getWeight = (category: SlaughterhouseCutCategory, mesaCode: string) => {
    const pct = percents[mesaCode] ?? DEFAULT_MESA_CARCASS_PERCENTS[mesaCode] ?? 20;
    if (useExactDesossaWeights) {
      return Number(((carcassWeight * pct) / 100).toFixed(2));
    }
    return SLAUGHTERHOUSE_CATEGORY_META[category].defaultWeightKg;
  };

  return {
    dianteiro: {
      category: 'dianteiro',
      label: SLAUGHTERHOUSE_CATEGORY_META.dianteiro.label,
      desossaGroup: 'SEGUNDA',
      standardWeightKg: getWeight('dianteiro', 'BOI-DIANT'),
      carcassPercent: percents['BOI-DIANT'] ?? DEFAULT_MESA_CARCASS_PERCENTS['BOI-DIANT'],
      costPerKg: getCost('BOI-DIANT'),
      includedCutsLabel: SLAUGHTERHOUSE_CATEGORY_META.dianteiro.includedCutsLabel,
    },
    traseiro: {
      category: 'traseiro',
      label: SLAUGHTERHOUSE_CATEGORY_META.traseiro.label,
      desossaGroup: 'TRASEIRO',
      standardWeightKg: getWeight('traseiro', 'BOI-TRAS'),
      carcassPercent: percents['BOI-TRAS'] ?? DEFAULT_MESA_CARCASS_PERCENTS['BOI-TRAS'],
      costPerKg: getCost('BOI-TRAS'),
      includedCutsLabel: SLAUGHTERHOUSE_CATEGORY_META.traseiro.includedCutsLabel,
    },
    coxao: {
      category: 'coxao',
      label: SLAUGHTERHOUSE_CATEGORY_META.coxao.label,
      desossaGroup: 'COXAO',
      standardWeightKg: getWeight('coxao', 'BOI-COXAO'),
      carcassPercent: percents['BOI-COXAO'] ?? DEFAULT_MESA_CARCASS_PERCENTS['BOI-COXAO'],
      costPerKg: getCost('BOI-COXAO'),
      includedCutsLabel: SLAUGHTERHOUSE_CATEGORY_META.coxao.includedCutsLabel,
    },
    alcatrao: {
      category: 'alcatrao',
      label: SLAUGHTERHOUSE_CATEGORY_META.alcatrao.label,
      desossaGroup: 'NOBRE',
      standardWeightKg: getWeight('alcatrao', 'BOI-ALCAT'),
      carcassPercent: percents['BOI-ALCAT'] ?? DEFAULT_MESA_CARCASS_PERCENTS['BOI-ALCAT'],
      costPerKg: getCost('BOI-ALCAT', yieldParams?.alcatraoCostKg),
      includedCutsLabel: SLAUGHTERHOUSE_CATEGORY_META.alcatrao.includedCutsLabel,
    },
    costela: {
      category: 'costela',
      label: SLAUGHTERHOUSE_CATEGORY_META.costela.label,
      desossaGroup: 'COSTELA',
      standardWeightKg: getWeight('costela', 'BOI-COST-GAU'),
      carcassPercent: percents['BOI-COST-GAU'] ?? DEFAULT_MESA_CARCASS_PERCENTS['BOI-COST-GAU'],
      costPerKg: getCost('BOI-COST-GAU', yieldParams?.costelaCostKg),
      includedCutsLabel: SLAUGHTERHOUSE_CATEGORY_META.costela.includedCutsLabel,
    },
  };
}

/**
 * Soma todos os cortes da Planilha de Compras por categoria (Câmara + Desossa):
 * - Dianteiro = Câmara Dianteiro + Paleta + Acém + Peito + Músculo
 * - Alcatrão (Nobre) = Câmara Alcatrão + Alcatra + Contra Filé + Picanha + Filé Mignon
 * - Coxão = Câmara Coxão + Chã + Patinho + Lagarto Redondo + Lagarto Plano
 * - Traseiro = Câmara Traseiro + Alcatrão (Nobre) + Coxão
 * - Costela = Câmara Costela Gaúcha + Costela Congelada
 */
export function calculateStoreStockFromSheetRow(
  row: SheetRowData,
  standards: Record<SlaughterhouseCutCategory, SlaughterhouseCategoryStandard>,
  yieldParams?: Partial<YieldParams> | null
): SlaughterhouseStoreStock {
  const cutWeights = yieldParams?.carcassWeight
    ? getCutYieldWeightsFromSimulation(yieldParams.carcassWeight, yieldParams.basis || 'carcass')
    : DEFAULT_CUT_YIELD_WEIGHTS;

  const num = (v: unknown): number => {
    const parsed = Number(v);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  // --- 1. DIANTEIRO (SEGUNDA) ---
  const paletaPc = num(row.paletaPecas);
  const acemPc = num(row.acemPecas);
  const peitoPc = num(row.peitoPecas);
  const musculoPc = num(row.musculoPecas);
  const camaraDiant = Math.round(num(row.camaraDianteiro));

  const paletaKg = Math.round(paletaPc * cutWeights.paleta);
  const acemKg = Math.round(acemPc * cutWeights.acem);
  const peitoKg = Math.round(peitoPc * cutWeights.peito);
  const musculoKg = Math.round(musculoPc * cutWeights.musculo);
  const debonedDiantKg = paletaKg + acemKg + peitoKg + musculoKg;
  const debonedDiantPc = Math.round(debonedDiantKg / Math.max(1, standards.dianteiro.standardWeightKg || 45));
  const diantTotalPc = camaraDiant + debonedDiantPc;
  const diantTotalKg = Math.round(camaraDiant * standards.dianteiro.standardWeightKg + debonedDiantKg);

  const dianteiro: SlaughterhouseCategoryStock = {
    pieces: diantTotalPc,
    chamberPieces: camaraDiant,
    debonedPieces: debonedDiantPc,
    kg: diantTotalKg,
    debonedKg: debonedDiantKg,
    breakdown: [
      `Câmara Dianteiro: ${camaraDiant} pç (${Math.round(camaraDiant * standards.dianteiro.standardWeightKg)} kg)`,
      `Paleta: ${paletaPc} pç (${paletaKg} kg)`,
      `Acém: ${acemPc} pç (${acemKg} kg)`,
      `Peito: ${peitoPc} pç (${peitoKg} kg)`,
      `Músculo: ${musculoPc} pç (${musculoKg} kg)`,
    ],
  };

  // --- 2. ALCATRÃO (NOBRE) ---
  const alcatraPc = num(row.alcatra !== undefined ? row.alcatra : row.alcatraPecas);
  const contraPc = num(row.contraFile !== undefined ? row.contraFile : row.contraFilePecas);
  const picanhaPc = num(row.picanha !== undefined ? row.picanha : row.picanhaPecas);
  const mignonPc = num(row.fileMignon !== undefined ? row.fileMignon : row.fileMignonPecas);
  const camaraAlc = Math.round(num(row.camaraAlcatrao));

  const alcatraKg = Math.round(alcatraPc * cutWeights.alcatra);
  const contraKg = Math.round(contraPc * cutWeights.contraFile);
  const picanhaKg = Math.round(picanhaPc * cutWeights.picanha);
  const mignonKg = Math.round(mignonPc * cutWeights.fileMignon);
  const debonedAlcKg = alcatraKg + contraKg + picanhaKg + mignonKg;
  const debonedAlcPc = Math.round(debonedAlcKg / Math.max(1, standards.alcatrao.standardWeightKg || 22));
  const alcTotalPc = camaraAlc + debonedAlcPc;
  const alcTotalKg = Math.round(camaraAlc * standards.alcatrao.standardWeightKg + debonedAlcKg);

  const alcatrao: SlaughterhouseCategoryStock = {
    pieces: alcTotalPc,
    chamberPieces: camaraAlc,
    debonedPieces: debonedAlcPc,
    kg: alcTotalKg,
    debonedKg: debonedAlcKg,
    breakdown: [
      `Câmara Alcatrão: ${camaraAlc} pç (${Math.round(camaraAlc * standards.alcatrao.standardWeightKg)} kg)`,
      `Alcatra: ${alcatraPc} (${alcatraKg} kg)`,
      `Contra Filé: ${contraPc} (${contraKg} kg)`,
      `Picanha: ${picanhaPc} (${picanhaKg} kg)`,
      `Filé Mignon: ${mignonPc} (${mignonKg} kg)`,
    ],
  };

  // --- 3. COXÃO (COXAO) ---
  const chaPc = num(row.chaPecas);
  const patinhoPc = num(row.patinhoPecas);
  const lagRedPc = num(row.lagartoRedondoPecas);
  const lagPlaPc = num(row.lagartoPlanoPecas);
  const camaraCoxao = Math.round(num(row.camaraCoxao));

  const chaKg = Math.round(chaPc * cutWeights.cha);
  const patinhoKg = Math.round(patinhoPc * cutWeights.patinho);
  const lagRedKg = Math.round(lagRedPc * cutWeights.lagartoRedondo);
  const lagPlaKg = Math.round(lagPlaPc * cutWeights.lagartoPlano);
  const debonedCoxaoKg = chaKg + patinhoKg + lagRedKg + lagPlaKg;
  const debonedCoxaoPc = Math.round(debonedCoxaoKg / Math.max(1, standards.coxao.standardWeightKg || 35));
  const coxaoTotalPc = camaraCoxao + debonedCoxaoPc;
  const coxaoTotalKg = Math.round(camaraCoxao * standards.coxao.standardWeightKg + debonedCoxaoKg);

  const coxao: SlaughterhouseCategoryStock = {
    pieces: coxaoTotalPc,
    chamberPieces: camaraCoxao,
    debonedPieces: debonedCoxaoPc,
    kg: coxaoTotalKg,
    debonedKg: debonedCoxaoKg,
    breakdown: [
      `Câmara Coxão: ${camaraCoxao} pç (${Math.round(camaraCoxao * standards.coxao.standardWeightKg)} kg)`,
      `Chã de Dentro: ${chaPc} (${chaKg} kg)`,
      `Patinho: ${patinhoPc} (${patinhoKg} kg)`,
      `Lagarto Redondo: ${lagRedPc} (${lagRedKg} kg)`,
      `Lagarto Plano: ${lagPlaPc} (${lagPlaKg} kg)`,
    ],
  };

  // --- 4. TRASEIRO (Câmara Traseiro + Soma Nobre [Alcatrão] + Coxão) ---
  const camaraTras = Math.round(num(row.camaraTraseiro));
  const camaraTrasKg = Math.round(camaraTras * standards.traseiro.standardWeightKg);
  const trasDebonedKg = alcTotalKg + coxaoTotalKg;
  const trasTotalKg = camaraTrasKg + trasDebonedKg;
  const trasEquivalentFromSubcuts = Math.round(
    trasDebonedKg / Math.max(1, standards.traseiro.standardWeightKg || 60)
  );
  const trasTotalPc = camaraTras + trasEquivalentFromSubcuts;

  const traseiro: SlaughterhouseCategoryStock = {
    pieces: trasTotalPc,
    chamberPieces: camaraTras,
    debonedPieces: trasEquivalentFromSubcuts,
    kg: trasTotalKg,
    debonedKg: trasDebonedKg,
    breakdown: [
      `Câmara Traseiro Inteiro: ${camaraTras} pç (${camaraTrasKg} kg)`,
      `Soma Alcatrão (Nobre): ${alcTotalPc} pç (${alcTotalKg} kg)`,
      `Soma Coxão: ${coxaoTotalPc} pç (${coxaoTotalKg} kg)`,
    ],
  };

  // --- 5. COSTELA (COSTELA) ---
  const camaraCostela = Math.round(num(row.camaraCostelaGaucha));
  const costelaCongPc = Math.round(num(row.costelaCong));
  const costelaTotalPc = camaraCostela + costelaCongPc;
  const costelaCongKg = Math.round(costelaCongPc * 15);
  const costelaTotalKg = Math.round(camaraCostela * standards.costela.standardWeightKg + costelaCongKg);

  const costela: SlaughterhouseCategoryStock = {
    pieces: costelaTotalPc,
    chamberPieces: camaraCostela,
    debonedPieces: costelaCongPc,
    kg: costelaTotalKg,
    debonedKg: costelaCongKg,
    breakdown: [
      `Câmara Costela Gaúcha: ${camaraCostela} pç (${Math.round(camaraCostela * standards.costela.standardWeightKg)} kg)`,
      `Costela Congelada / Desossa: ${costelaCongPc} (${costelaCongKg} kg)`,
    ],
  };

  return {
    dianteiro,
    traseiro,
    coxao,
    alcatrao,
    costela,
  };
}

/**
 * Converte Venda em KG para Peças usando o Peso Padrão da peça:
 * Ex.: "Padrão do dianteiro 45kg, venda informada 350kg -> 350 / 45 = 7,78 peças"
 */
export function convertSalesKgToPieces(weightKg: number, standardWeightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return 0;
  if (!Number.isFinite(standardWeightKg) || standardWeightKg <= 0) return 0;
  return Number((weightKg / standardWeightKg).toFixed(2));
}

export function getSalesPiecesBreakdown(
  sales: SlaughterhouseSalesEntry,
  standards: Record<SlaughterhouseCutCategory, SlaughterhouseCategoryStandard>
) {
  return {
    dianteiroPecas: convertSalesKgToPieces(sales.dianteiroKg, standards.dianteiro.standardWeightKg),
    traseiroPecas: convertSalesKgToPieces(sales.traseiroKg, standards.traseiro.standardWeightKg),
    coxaoPecas: convertSalesKgToPieces(sales.coxaoKg, standards.coxao.standardWeightKg),
    alcatraoPecas: convertSalesKgToPieces(sales.alcatraoKg, standards.alcatrao.standardWeightKg),
    costelaPecas: convertSalesKgToPieces(sales.costelaKg, standards.costela.standardWeightKg),
  };
}

/**
 * Consolida os itens extraídos de um PDF de vendas pelas 5 categorias da Desossa.
 * Importante: na Desossa, Traseiro = Nobre (Alcatrão) + Coxão + Traseiro direto.
 */
export function summarizePdfSalesByCategory(
  items: PdfSalesParsedCutItem[],
  standards: Record<SlaughterhouseCutCategory, SlaughterhouseCategoryStandard>
): {
  summaries: Record<SlaughterhouseCutCategory, PdfSalesCategorySummary>;
  salesEntry: SlaughterhouseSalesEntry;
  directTraseiroKg: number;
} {
  const sums: Record<SlaughterhouseCutCategory, { kg: number; count: number }> = {
    dianteiro: { kg: 0, count: 0 },
    traseiro: { kg: 0, count: 0 },
    coxao: { kg: 0, count: 0 },
    alcatrao: { kg: 0, count: 0 },
    costela: { kg: 0, count: 0 },
  };

  for (const item of items) {
    const w = Number(item.weightKg) || 0;
    if (w <= 0) continue;
    sums[item.category].kg += w;
    sums[item.category].count += 1;
  }

  const directTraseiroKg = Number(sums.traseiro.kg.toFixed(2));
  const dianteiroKg = Number(sums.dianteiro.kg.toFixed(2));
  const coxaoKg = Number(sums.coxao.kg.toFixed(2));
  const alcatraoKg = Number(sums.alcatrao.kg.toFixed(2));
  const costelaKg = Number(sums.costela.kg.toFixed(2));
  // Traseiro combina Traseiro direto + Alcatrão (Nobre) + Coxão conforme Desossa
  const combinedTraseiroKg = Number((directTraseiroKg + alcatraoKg + coxaoKg).toFixed(2));

  const buildSummary = (cat: SlaughterhouseCutCategory, totalKg: number, itemsCount: number): PdfSalesCategorySummary => {
    const stdW = standards[cat].standardWeightKg;
    const exactPieces = convertSalesKgToPieces(totalKg, stdW);
    return {
      category: cat,
      label: standards[cat].label,
      desossaGroup: standards[cat].desossaGroup,
      totalKg,
      standardWeightKg: stdW,
      exactPieces,
      roundedPieces: Math.round(exactPieces),
      itemsCount,
    };
  };

  const summaries: Record<SlaughterhouseCutCategory, PdfSalesCategorySummary> = {
    dianteiro: buildSummary('dianteiro', dianteiroKg, sums.dianteiro.count),
    traseiro: buildSummary(
      'traseiro',
      combinedTraseiroKg,
      sums.traseiro.count + sums.alcatrao.count + sums.coxao.count
    ),
    coxao: buildSummary('coxao', coxaoKg, sums.coxao.count),
    alcatrao: buildSummary('alcatrao', alcatraoKg, sums.alcatrao.count),
    costela: buildSummary('costela', costelaKg, sums.costela.count),
  };

  return {
    summaries,
    salesEntry: {
      dianteiroKg,
      traseiroKg: combinedTraseiroKg,
      coxaoKg,
      alcatraoKg,
      costelaKg,
    },
    directTraseiroKg,
  };
}

/**
 * Parser determinístico de texto tabular de vendas (para fallback sem Gemini ou colagem direta de relatório).
 * Não inventa dados: retorna somente linhas reais com nome de corte e peso em KG identificável.
 */
export function parseRawSalesText(rawText: string): {
  items: PdfSalesParsedCutItem[];
  unclassifiedLines: string[];
} {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 2);

  const items: PdfSalesParsedCutItem[] = [];
  const unclassifiedLines: string[] = [];

  const knownCutHints = [
    'picanha',
    'mignon',
    'contra',
    'alcatra',
    'maminha',
    'ancho',
    'chorizo',
    'cha',
    'chã',
    'coxao',
    'coxão',
    'patinho',
    'lagarto',
    'paleta',
    'acem',
    'acém',
    'peito',
    'musculo',
    'músculo',
    'dianteiro',
    'traseiro',
    'costela',
    'ponta de agulha',
    'peixinho',
    'raquete',
    'cupim',
    'capa de file',
    'bananinha',
    'posta',
  ];

  const parseBrNumber = (str: string): number => {
    const cleaned = str.replace(/\s/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
      return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    if (cleaned.includes(',')) {
      return Number(cleaned.replace(',', '.')) || 0;
    }
    return Number(cleaned) || 0;
  };

  lines.forEach((line, idx) => {
    const norm = normalizeTextForClassification(line);
    const hasCutWord = knownCutHints.some(h => norm.includes(normalizeTextForClassification(h)));
    if (!hasCutWord) return;

    // Evita linhas de cabeçalho/totalização sem corte específico
    if (/^(total geral|resumo|subtotal|loja|filial|relatorio|pagina)\b/i.test(norm)) {
      return;
    }

    // Procura explicitamente por "<numero> kg" ou primeiro número decimal/inteiro após o nome do corte
    const kgMatch = line.match(/(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)\s*(?:kg|kilos?|quilos?)\b/i);
    let weightKg = kgMatch ? parseBrNumber(kgMatch[1]) : 0;

    // Captura valor financeiro R$ se houver
    const moneyMatch = line.match(/R\$\s*(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)/i);
    const revenueR$ = moneyMatch ? parseBrNumber(moneyMatch[1]) : undefined;

    // Nome do corte = parte textual antes dos números (ou antes de 'kg')
    let cutName = line
      .replace(/R\$\s*[\d.,]+/gi, '')
      .replace(/(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,3})?|\d+(?:[.,]\d{1,3})?)\s*(?:kg|kilos?|quilos?|pç|pcs?|un)?/gi, ' ')
      .replace(/^\s*\d{2,6}\s*[-–|]?\s*/, '')
      .replace(/[|;:\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (weightKg <= 0) {
      // Tenta extrair último número plausível não monetário na linha (ex.: "ACÉM BOVINO   125,40")
      const withoutMoney = line.replace(/R\$\s*[\d.,]+/gi, '');
      const nums = Array.from(withoutMoney.matchAll(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,3})|\d+(?:[.,]\d{1,3})?)/g))
        .map(m => parseBrNumber(m[1]))
        .filter(n => n > 0 && n < 500000);
      if (nums.length > 0) {
        // Prefere decimal com vírgula ou o primeiro valor após código do produto
        weightKg = nums.length > 1 && nums[0] > 999 && Number.isInteger(nums[0]) ? nums[1] : nums[0];
      }
    }

    if (weightKg > 0 && cutName.length >= 3) {
      const classified = classifyBeefCut(cutName);
      items.push({
        id: `cut-${Date.now()}-${idx}`,
        cutName,
        category: classified.category,
        desossaGroup: classified.desossaGroup,
        weightKg: Number(weightKg.toFixed(2)),
        revenueR$,
        matchedBy: classified.matchedBy,
      });
    } else {
      unclassifiedLines.push(line);
    }
  });

  return { items, unclassifiedLines };
}

export function createInitialSlaughterhouseDraft(
  stores: Store[],
  suppliers: Supplier[],
  sheetRows: SheetRowData[],
  yieldParams?: Partial<YieldParams> | null
): SlaughterhouseOrderDraft {
  const standards = buildSlaughterhouseStandardsFromDesossa(yieldParams, false);
  const activeSupplier = suppliers.find(s => s.active) || suppliers[0];
  const today = new Date();
  const delivery = new Date(today.getTime() + 86400000);
  const toIso = (d: Date) => d.toISOString().slice(0, 10);

  const storeRows: SlaughterhouseStoreOrderRow[] = stores.map(store => {
    const sheetRow = sheetRows.find(r => r.storeId === store.id);
    return {
      storeId: store.id,
      storeName: store.name,
      pedidoDianteiro: 0,
      pedidoTraseiro: 0,
      pedidoCoxao: 0,
      pedidoAlcatrao: Number(sheetRow?.pedidoAlcatraoReal || 0),
      pedidoCostela: Number(sheetRow?.pedidoCostelaReal || 0),
      sales: {
        dianteiroKg: 0,
        traseiroKg: 0,
        coxaoKg: 0,
        alcatraoKg: 0,
        costelaKg: 0,
      },
    };
  });

  return {
    supplierId: activeSupplier?.id || '',
    supplierName: activeSupplier?.tradeName || activeSupplier?.name || 'Selecionar Frigorífico',
    orderNumber: `PF-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 899)}`,
    orderDate: toIso(today),
    deliveryDate: toIso(delivery),
    buyer: 'Patrick Pessoa (Diretoria de Compras)',
    paymentTerms: activeSupplier?.paymentTerms || '14 dias',
    notes: 'Pedido gerado pelo módulo Pedido por Frigorífico com base na Desossa e Planilha Matriz.',
    standards,
    storeRows,
    lastPdfImport: null,
    updatedAt: Date.now(),
  };
}

export function buildSlaughterhouseReportRows(
  storeRows: SlaughterhouseStoreOrderRow[],
  sheetRows: SheetRowData[],
  standards: Record<SlaughterhouseCutCategory, SlaughterhouseCategoryStandard>,
  yieldParams?: Partial<YieldParams> | null
): {
  reportRows: SlaughterhouseOrderReportRow[];
  totals: {
    pedidoDianteiro: number;
    pedidoTraseiro: number;
    pedidoCoxao: number;
    pedidoAlcatrao: number;
    pedidoCostela: number;
    totalPieces: number;
    totalWeightKg: number;
    totalCostR$: number;
    stockDianteiroPc: number;
    stockTraseiroPc: number;
    stockCoxaoPc: number;
    stockAlcatraoPc: number;
    stockCostelaPc: number;
    salesDianteiroKg: number;
    salesTraseiroKg: number;
    salesCoxaoKg: number;
    salesAlcatraoKg: number;
    salesCostelaKg: number;
    salesDianteiroPc: number;
    salesTraseiroPc: number;
    salesCoxaoPc: number;
    salesAlcatraoPc: number;
    salesCostelaPc: number;
  };
} {
  const totals = {
    pedidoDianteiro: 0,
    pedidoTraseiro: 0,
    pedidoCoxao: 0,
    pedidoAlcatrao: 0,
    pedidoCostela: 0,
    totalPieces: 0,
    totalWeightKg: 0,
    totalCostR$: 0,
    stockDianteiroPc: 0,
    stockTraseiroPc: 0,
    stockCoxaoPc: 0,
    stockAlcatraoPc: 0,
    stockCostelaPc: 0,
    salesDianteiroKg: 0,
    salesTraseiroKg: 0,
    salesCoxaoKg: 0,
    salesAlcatraoKg: 0,
    salesCostelaKg: 0,
    salesDianteiroPc: 0,
    salesTraseiroPc: 0,
    salesCoxaoPc: 0,
    salesAlcatraoPc: 0,
    salesCostelaPc: 0,
  };

  const reportRows: SlaughterhouseOrderReportRow[] = storeRows.map(sr => {
    const matchedSheet = sheetRows.find(r => r.storeId === sr.storeId) || {
      storeId: sr.storeId,
      storeName: sr.storeName,
      pedidoDianteiro: 0,
      pedidoTraseiro: 0,
      pedidoCoxao: 0,
      pedidoAlcatrao: 0,
      pedidoCostelaGaucha: 0,
      boiAVenda: 0,
      sugestaoPedido: 0,
      pTransito: 0,
      camaraDianteiro: 0,
      camaraTraseiro: 0,
      camaraCoxao: 0,
      camaraAlcatrao: 0,
      somaDoTraseiro: 0,
      camaraCostelaGaucha: 0,
      alcatra: 0,
      contraFile: 0,
      costelaCong: 0,
      totalAlcatrao: 0,
      picanha: 0,
      fileMignon: 0,
      totalDianteiro: 0,
      paletaKg: 0,
      paletaPecas: 0,
      acemKg: 0,
      acemPecas: 0,
      peitoKg: 0,
      peitoPecas: 0,
      musculoKg: 0,
      musculoPecas: 0,
      totalCoxao: 0,
      chaKg: 0,
      chaPecas: 0,
      patinhoKg: 0,
      patinhoPecas: 0,
      lagartoRedondoKg: 0,
      lagartoRedondoPecas: 0,
      lagartoPlanoKg: 0,
      lagartoPlanoPecas: 0,
      bandaKg: 0,
      bandaPecas: 0,
      costelaSuinaPecas: 0,
      pernilPecas: 0,
    };

    const stock = calculateStoreStockFromSheetRow(matchedSheet, standards, yieldParams);
    const salesPc = getSalesPiecesBreakdown(sr.sales, standards);

    const pDiant = Math.max(0, Math.round(Number(sr.pedidoDianteiro) || 0));
    const pTras = Math.max(0, Math.round(Number(sr.pedidoTraseiro) || 0));
    const pCox = Math.max(0, Math.round(Number(sr.pedidoCoxao) || 0));
    const pAlc = Math.max(0, Math.round(Number(sr.pedidoAlcatrao) || 0));
    const pCost = Math.max(0, Math.round(Number(sr.pedidoCostela) || 0));

    const wDiant = pDiant * standards.dianteiro.standardWeightKg;
    const wTras = pTras * standards.traseiro.standardWeightKg;
    const wCox = pCox * standards.coxao.standardWeightKg;
    const wAlc = pAlc * standards.alcatrao.standardWeightKg;
    const wCost = pCost * standards.costela.standardWeightKg;

    const totalPieces = pDiant + pTras + pCox + pAlc + pCost;
    const totalWeightKg = Number((wDiant + wTras + wCox + wAlc + wCost).toFixed(2));
    const totalCostR$ = Number(
      (
        wDiant * standards.dianteiro.costPerKg +
        wTras * standards.traseiro.costPerKg +
        wCox * standards.coxao.costPerKg +
        wAlc * standards.alcatrao.costPerKg +
        wCost * standards.costela.costPerKg
      ).toFixed(2)
    );

    totals.pedidoDianteiro += pDiant;
    totals.pedidoTraseiro += pTras;
    totals.pedidoCoxao += pCox;
    totals.pedidoAlcatrao += pAlc;
    totals.pedidoCostela += pCost;
    totals.totalPieces += totalPieces;
    totals.totalWeightKg += totalWeightKg;
    totals.totalCostR$ += totalCostR$;

    totals.stockDianteiroPc += stock.dianteiro.pieces;
    totals.stockTraseiroPc += stock.traseiro.pieces;
    totals.stockCoxaoPc += stock.coxao.pieces;
    totals.stockAlcatraoPc += stock.alcatrao.pieces;
    totals.stockCostelaPc += stock.costela.pieces;

    totals.salesDianteiroKg += sr.sales.dianteiroKg;
    totals.salesTraseiroKg += sr.sales.traseiroKg;
    totals.salesCoxaoKg += sr.sales.coxaoKg;
    totals.salesAlcatraoKg += sr.sales.alcatraoKg;
    totals.salesCostelaKg += sr.sales.costelaKg;

    totals.salesDianteiroPc += salesPc.dianteiroPecas;
    totals.salesTraseiroPc += salesPc.traseiroPecas;
    totals.salesCoxaoPc += salesPc.coxaoPecas;
    totals.salesAlcatraoPc += salesPc.alcatraoPecas;
    totals.salesCostelaPc += salesPc.costelaPecas;

    return {
      storeId: sr.storeId,
      storeName: sr.storeName,
      stock: {
        dianteiroPecas: stock.dianteiro.pieces,
        dianteiroKg: stock.dianteiro.kg,
        traseiroPecas: stock.traseiro.pieces,
        traseiroKg: stock.traseiro.kg,
        coxaoPecas: stock.coxao.pieces,
        coxaoKg: stock.coxao.kg,
        alcatraoPecas: stock.alcatrao.pieces,
        alcatraoKg: stock.alcatrao.kg,
        costelaPecas: stock.costela.pieces,
        costelaKg: stock.costela.kg,
      },
      sales: {
        dianteiroKg: Number(sr.sales.dianteiroKg.toFixed(2)),
        dianteiroPecas: salesPc.dianteiroPecas,
        traseiroKg: Number(sr.sales.traseiroKg.toFixed(2)),
        traseiroPecas: salesPc.traseiroPecas,
        coxaoKg: Number(sr.sales.coxaoKg.toFixed(2)),
        coxaoPecas: salesPc.coxaoPecas,
        alcatraoKg: Number(sr.sales.alcatraoKg.toFixed(2)),
        alcatraoPecas: salesPc.alcatraoPecas,
        costelaKg: Number(sr.sales.costelaKg.toFixed(2)),
        costelaPecas: salesPc.costelaPecas,
      },
      order: {
        pedidoDianteiro: pDiant,
        pedidoTraseiro: pTras,
        pedidoCoxao: pCox,
        pedidoAlcatrao: pAlc,
        pedidoCostela: pCost,
        totalPieces,
        totalWeightKg,
        totalCostR$,
      },
    };
  });

  totals.totalWeightKg = Number(totals.totalWeightKg.toFixed(2));
  totals.totalCostR$ = Number(totals.totalCostR$.toFixed(2));
  totals.salesDianteiroKg = Number(totals.salesDianteiroKg.toFixed(2));
  totals.salesTraseiroKg = Number(totals.salesTraseiroKg.toFixed(2));
  totals.salesCoxaoKg = Number(totals.salesCoxaoKg.toFixed(2));
  totals.salesAlcatraoKg = Number(totals.salesAlcatraoKg.toFixed(2));
  totals.salesCostelaKg = Number(totals.salesCostelaKg.toFixed(2));
  totals.salesDianteiroPc = Number(totals.salesDianteiroPc.toFixed(2));
  totals.salesTraseiroPc = Number(totals.salesTraseiroPc.toFixed(2));
  totals.salesCoxaoPc = Number(totals.salesCoxaoPc.toFixed(2));
  totals.salesAlcatraoPc = Number(totals.salesAlcatraoPc.toFixed(2));
  totals.salesCostelaPc = Number(totals.salesCostelaPc.toFixed(2));

  return { reportRows, totals };
}
