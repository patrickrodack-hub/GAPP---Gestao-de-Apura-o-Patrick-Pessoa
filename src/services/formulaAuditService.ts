import { SheetRowData } from '../types/erp';
import { CutYieldWeights } from './calculationService';

export interface FormulaDiscrepancy {
  rowIdx: number;
  storeId: string;
  storeName: string;
  field: keyof SheetRowData;
  columnLabel: string;
  group: string;
  currentValue: number;
  expectedValue: number;
  difference: number;
  formulaRule: string;
  factorUsed?: number;
}

export interface SheetAuditReport {
  totalChecked: number;
  discrepanciesCount: number;
  isValid: boolean;
  discrepancies: FormulaDiscrepancy[];
  discrepancyMap: Record<string, FormulaDiscrepancy>; // Key: `${rowIdx}_${field}`
}

/**
 * Realiza auditoria matemática em tempo real das fórmulas da planilha
 * Valida fatores constantes (35 para Dianteiro/Coxão, 22 para Alcatrão, 36 para Banda Suína, Divisão por 2 do Boi, etc.)
 */
export function auditSheetFormulas(
  rows: SheetRowData[],
  cutWeights: CutYieldWeights
): SheetAuditReport {
  const discrepancies: FormulaDiscrepancy[] = [];
  const discrepancyMap: Record<string, FormulaDiscrepancy> = {};
  let totalChecked = 0;

  rows.forEach((row, rowIdx) => {
    // 1. --- Nobres / Alcatrão (Fator 22) ---
    const fileMignonPecas = Number(row.fileMignon !== undefined ? row.fileMignon : (row.fileMignonPecas || 0)) || 0;
    const fileMignonKg = Math.round(fileMignonPecas * cutWeights.fileMignon);

    const picanhaPecas = Number(row.picanha !== undefined ? row.picanha : (row.picanhaPecas || 0)) || 0;
    const picanhaKg = Math.round(picanhaPecas * cutWeights.picanha);

    const alcatraPecas = Number(row.alcatra !== undefined ? row.alcatra : (row.alcatraPecas || 0)) || 0;
    const alcatraKg = Math.round(alcatraPecas * cutWeights.alcatra);

    const contraFilePecas = Number(row.contraFile !== undefined ? row.contraFile : (row.contraFilePecas || 0)) || 0;
    const contraFileKg = Math.round(contraFilePecas * cutWeights.contraFile);

    const sumAlcatraoKg = fileMignonKg + alcatraKg + picanhaKg + contraFileKg;
    const expectedTotalAlcatrao = Math.round(sumAlcatraoKg / 22);

    totalChecked++;
    const currentTotAlcatrao = Number(row.totalAlcatrao) || 0;
    if (Math.abs(currentTotAlcatrao - expectedTotalAlcatrao) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'totalAlcatrao',
        columnLabel: 'Tot. Alcatrão',
        group: 'Balcão/Nobres',
        currentValue: currentTotAlcatrao,
        expectedValue: expectedTotalAlcatrao,
        difference: currentTotAlcatrao - expectedTotalAlcatrao,
        formulaRule: `(File Mignon Kg + Alcatra Kg + Picanha Kg + Contra Filé Kg) / 22 = (${sumAlcatraoKg} / 22)`,
        factorUsed: 22
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_totalAlcatrao`] = disc;
    }

    // 2. --- Balcão Dianteiro (Fator 35) ---
    const paletaPecas = Number(row.paletaPecas) || 0;
    const paletaKg = Math.round(paletaPecas * cutWeights.paleta);

    const acemPecas = Number(row.acemPecas) || 0;
    const acemKg = Math.round(acemPecas * cutWeights.acem);

    const peitoPecas = Number(row.peitoPecas) || 0;
    const peitoKg = Math.round(peitoPecas * cutWeights.peito);

    const musculoPecas = Number(row.musculoPecas) || 0;
    const musculoKg = Math.round(musculoPecas * cutWeights.musculo);

    const sumDianteiroKg = paletaKg + acemKg + peitoKg + musculoKg;
    const expectedTotalDianteiro = Math.round(sumDianteiroKg / 35);

    totalChecked++;
    const currentTotDianteiro = Number(row.totalDianteiro) || 0;
    if (Math.abs(currentTotDianteiro - expectedTotalDianteiro) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'totalDianteiro',
        columnLabel: 'Tot. Dianteiro',
        group: 'Dianteiro',
        currentValue: currentTotDianteiro,
        expectedValue: expectedTotalDianteiro,
        difference: currentTotDianteiro - expectedTotalDianteiro,
        formulaRule: `(Paleta Kg + Acém Kg + Peito Kg + Músculo Kg) / 35 = (${sumDianteiroKg} / 35)`,
        factorUsed: 35
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_totalDianteiro`] = disc;
    }

    // 3. --- Balcão Coxão (Fator 35) ---
    const chaPecas = Number(row.chaPecas) || 0;
    const chaKg = Math.round(chaPecas * cutWeights.cha);

    const patinhoPecas = Number(row.patinhoPecas) || 0;
    const patinhoKg = Math.round(patinhoPecas * cutWeights.patinho);

    const lagartoRedondoPecas = Number(row.lagartoRedondoPecas) || 0;
    const lagartoRedondoKg = Math.round(lagartoRedondoPecas * cutWeights.lagartoRedondo);

    const lagartoPlanoPecas = Number(row.lagartoPlanoPecas) || 0;
    const lagartoPlanoKg = Math.round(lagartoPlanoPecas * cutWeights.lagartoPlano);

    const sumCoxaoKg = chaKg + patinhoKg + lagartoPlanoKg + lagartoRedondoKg;
    const expectedTotalCoxao = Math.round(sumCoxaoKg / 35);

    totalChecked++;
    const currentTotCoxao = Number(row.totalCoxao) || 0;
    if (Math.abs(currentTotCoxao - expectedTotalCoxao) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'totalCoxao',
        columnLabel: 'Tot. Coxão',
        group: 'Coxão',
        currentValue: currentTotCoxao,
        expectedValue: expectedTotalCoxao,
        difference: currentTotCoxao - expectedTotalCoxao,
        formulaRule: `(Chã Kg + Patinho Kg + Lag. Plano Kg + Lag. Red. Kg) / 35 = (${sumCoxaoKg} / 35)`,
        factorUsed: 35
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_totalCoxao`] = disc;
    }

    // 4. --- Peça Inteira Câmara ---
    const camaraDianteiro = Math.round(Number(row.camaraDianteiro) || 0);
    const camaraTraseiro = Math.round(Number(row.camaraTraseiro) || 0);
    const camaraCoxao = Math.round(Number(row.camaraCoxao) || 0);
    const camaraAlcatrao = Math.round(Number(row.camaraAlcatrao) || 0);
    const camaraCostelaGaucha = Math.round(Number(row.camaraCostelaGaucha) || 0);

    const expectedSomaTraseiro = Math.round(camaraTraseiro + camaraCoxao + camaraAlcatrao);
    totalChecked++;
    const currentSomaTraseiro = Number(row.somaDoTraseiro) || 0;
    if (Math.abs(currentSomaTraseiro - expectedSomaTraseiro) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'somaDoTraseiro',
        columnLabel: 'Soma Traseiro',
        group: 'Câmara',
        currentValue: currentSomaTraseiro,
        expectedValue: expectedSomaTraseiro,
        difference: currentSomaTraseiro - expectedSomaTraseiro,
        formulaRule: `Câm. Traseiro (${camaraTraseiro}) + Câm. Coxão (${camaraCoxao}) + Câm. Alcatrão (${camaraAlcatrao})`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_somaDoTraseiro`] = disc;
    }

    // 5. --- Dados de Pedido ---
    // Dianteiro: Dianteiro Câmara + Tot. Diant. Desossa
    const expectedPedDianteiro = Math.round(camaraDianteiro + expectedTotalDianteiro);
    totalChecked++;
    const currentPedDianteiro = Number(row.pedidoDianteiro) || 0;
    if (Math.abs(currentPedDianteiro - expectedPedDianteiro) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'pedidoDianteiro',
        columnLabel: 'Ped. Dianteiro',
        group: 'Pedido',
        currentValue: currentPedDianteiro,
        expectedValue: expectedPedDianteiro,
        difference: currentPedDianteiro - expectedPedDianteiro,
        formulaRule: `Câm. Dianteiro (${camaraDianteiro}) + Tot. Dianteiro (${expectedTotalDianteiro})`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_pedidoDianteiro`] = disc;
    }

    // Traseiro: Traseiro Câmara
    const expectedPedTraseiro = Math.round(camaraTraseiro);
    totalChecked++;
    const currentPedTraseiro = Number(row.pedidoTraseiro) || 0;
    if (Math.abs(currentPedTraseiro - expectedPedTraseiro) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'pedidoTraseiro',
        columnLabel: 'Ped. Traseiro',
        group: 'Pedido',
        currentValue: currentPedTraseiro,
        expectedValue: expectedPedTraseiro,
        difference: currentPedTraseiro - expectedPedTraseiro,
        formulaRule: `Câm. Traseiro (${camaraTraseiro})`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_pedidoTraseiro`] = disc;
    }

    // Coxão: Coxão Câmara + Tot. Coxão Desossa
    const expectedPedCoxao = Math.round(camaraCoxao + expectedTotalCoxao);
    totalChecked++;
    const currentPedCoxao = Number(row.pedidoCoxao) || 0;
    if (Math.abs(currentPedCoxao - expectedPedCoxao) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'pedidoCoxao',
        columnLabel: 'Ped. Coxão',
        group: 'Pedido',
        currentValue: currentPedCoxao,
        expectedValue: expectedPedCoxao,
        difference: currentPedCoxao - expectedPedCoxao,
        formulaRule: `Câm. Coxão (${camaraCoxao}) + Tot. Coxão (${expectedTotalCoxao})`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_pedidoCoxao`] = disc;
    }

    // Alcatrão: Alcatrão Câmara + Tot. Alcatrão Desossa
    const expectedPedAlcatrao = Math.round(camaraAlcatrao + expectedTotalAlcatrao);
    totalChecked++;
    const currentPedAlcatrao = Number(row.pedidoAlcatrao) || 0;
    if (Math.abs(currentPedAlcatrao - expectedPedAlcatrao) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'pedidoAlcatrao',
        columnLabel: 'Ped. Alcatrão',
        group: 'Pedido',
        currentValue: currentPedAlcatrao,
        expectedValue: expectedPedAlcatrao,
        difference: currentPedAlcatrao - expectedPedAlcatrao,
        formulaRule: `Câm. Alcatrão (${camaraAlcatrao}) + Tot. Alcatrão (${expectedTotalAlcatrao})`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_pedidoAlcatrao`] = disc;
    }

    // Costela Gaúcha: Costela Gaúcha Câmara
    const expectedPedCostela = Math.round(camaraCostelaGaucha);
    totalChecked++;
    const currentPedCostela = Number(row.pedidoCostelaGaucha) || 0;
    if (Math.abs(currentPedCostela - expectedPedCostela) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'pedidoCostelaGaucha',
        columnLabel: 'Ped. Costela Gaúcha',
        group: 'Pedido',
        currentValue: currentPedCostela,
        expectedValue: expectedPedCostela,
        difference: currentPedCostela - expectedPedCostela,
        formulaRule: `Câm. Costela Gaúcha (${camaraCostelaGaucha})`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_pedidoCostelaGaucha`] = disc;
    }

    // 6. --- Boi & Sugestão ---
    const expectedBoi = Math.round((expectedPedDianteiro + expectedPedTraseiro + expectedPedCoxao + expectedPedAlcatrao) / 2);
    totalChecked++;
    const currentBoi = Number(row.boi) || 0;
    if (Math.abs(currentBoi - expectedBoi) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'boi',
        columnLabel: 'Boi',
        group: 'Pedido',
        currentValue: currentBoi,
        expectedValue: expectedBoi,
        difference: currentBoi - expectedBoi,
        formulaRule: `(Ped. Diant. + Ped. Tras. + Ped. Coxão + Ped. Alcat.) / 2 = (${expectedPedDianteiro + expectedPedTraseiro + expectedPedCoxao + expectedPedAlcatrao} / 2)`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_boi`] = disc;
    }

    const venda = Math.round(Number(row.venda !== undefined ? row.venda : row.boiAVenda) || 0);
    const expectedSugestao = Math.round(venda - expectedBoi);
    totalChecked++;
    const currentSugestao = Number(row.sugestaoPedido) || 0;
    if (Math.abs(currentSugestao - expectedSugestao) > 0.001) {
      const disc: FormulaDiscrepancy = {
        rowIdx,
        storeId: row.storeId,
        storeName: row.storeName,
        field: 'sugestaoPedido',
        columnLabel: 'Sugestão',
        group: 'Pedido',
        currentValue: currentSugestao,
        expectedValue: expectedSugestao,
        difference: currentSugestao - expectedSugestao,
        formulaRule: `Venda (${venda}) - Boi (${expectedBoi}) = ${expectedSugestao}`
      };
      discrepancies.push(disc);
      discrepancyMap[`${rowIdx}_sugestaoPedido`] = disc;
    }
  });

  return {
    totalChecked,
    discrepanciesCount: discrepancies.length,
    isValid: discrepancies.length === 0,
    discrepancies,
    discrepancyMap,
  };
}

/**
 * Lista dos campos considerados estritamente FÓRMULAS / SOMATÓRIOS
 * (que devem ser bloqueados no Modo Protegido para evitar edição acidental)
 */
export const FORMULA_FIELDS: (keyof SheetRowData)[] = [
  'totalAlcatrao',
  'totalDianteiro',
  'totalCoxao',
  'somaDoTraseiro',
  'pedidoDianteiro',
  'pedidoTraseiro',
  'pedidoCoxao',
  'pedidoAlcatrao',
  'pedidoCostelaGaucha',
  'boi',
  'sugestaoPedido',
];

export function isFormulaField(field: keyof SheetRowData): boolean {
  return FORMULA_FIELDS.includes(field);
}
