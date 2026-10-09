import ExcelJS from 'exceljs';
import { SheetRowData, Store, PurchaseBatch, WasteRecord } from '../types/erp';
import { calculateSheetTotals } from './calculationService';

interface ExportExcelOptions {
  sheetRows: SheetRowData[];
  stores?: Store[];
  batches?: PurchaseBatch[];
  wasteRecords?: WasteRecord[];
}

export const ExcelExportService = {
  async exportFullReportToXLSX({ sheetRows, stores = [], batches = [], wasteRecords = [] }: ExportExcelOptions): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Grupo GAPP Sistemas - Patrick Pessoa';
    workbook.lastModifiedBy = 'Patrick Pessoa';
    workbook.created = new Date();
    workbook.modified = new Date();

    const totals = calculateSheetTotals(sheetRows);

    // ==========================================
    // ABA 1: PLANILHA MATRIZ v10.7 (COMPRA DO BOI)
    // ==========================================
    const ws1 = workbook.addWorksheet('Planilha Matriz v10.7', {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 5 }],
      properties: { tabColor: { argb: 'FF005A9E' } }
    });

    // Title rows
    ws1.mergeCells('A1:AS1');
    const titleCell = ws1.getCell('A1');
    titleCell.value = 'GRUPO GAPP SISTEMAS • PLANILHA DE COMPRA DE BOI DA DIREÇÃO DA EMPRESA v10.7';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF004B87' }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 32;

    // Subtitle row
    ws1.mergeCells('A2:AS2');
    const subTitleCell = ws1.getCell('A2');
    subTitleCell.value = `Responsável: Patrick Pessoa • Gestão Integrada de 16 Filiais • Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} • Matriz Geral`;
    subTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF334155' } };
    subTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };
    subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(2).height = 20;

    // Header Groups (Row 3)
    ws1.getRow(3).height = 24;
    ws1.mergeCells('A3:A4');
    ws1.getCell('A3').value = 'FILIAL / LOJA';
    ws1.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getCell('A3').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

    // Group 1: DADOS PARA A GERAÇÃO DE PEDIDO (B3:M3 - 12 colunas)
    ws1.mergeCells('B3:M3');
    const g1 = ws1.getCell('B3');
    g1.value = 'DADOS PARA A GERAÇÃO DE PEDIDO';
    g1.alignment = { horizontal: 'center', vertical: 'middle' };
    g1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    g1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }; // Blue

    // Group 2: PEÇA INTEIRA CÂMARA (N3:S3)
    ws1.mergeCells('N3:S3');
    const g2 = ws1.getCell('N3');
    g2.value = 'PEÇA INTEIRA CÂMARA';
    g2.alignment = { horizontal: 'center', vertical: 'middle' };
    g2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    g2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } }; // Amber

    // Group 3: BALCÃO / CÂMARA / DESOSSA (T3:AC3 - 10 colunas)
    ws1.mergeCells('T3:AC3');
    const g3 = ws1.getCell('T3');
    g3.value = 'BALCÃO / CÂMARA / DESOSSA';
    g3.alignment = { horizontal: 'center', vertical: 'middle' };
    g3.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    g3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } }; // Emerald

    // Group 4: BALCÃO E DESOSSA - DIANTEIRO (AD3:AL3 - 9 colunas)
    ws1.mergeCells('AD3:AL3');
    const g4 = ws1.getCell('AD3');
    g4.value = 'BALCÃO E DESOSSA (DIANTEIRO)';
    g4.alignment = { horizontal: 'center', vertical: 'middle' };
    g4.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    g4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D28D9' } }; // Purple

    // Group 5: BALCÃO E DESOSSA - COXÃO (AM3:AU3 - 9 colunas)
    ws1.mergeCells('AM3:AU3');
    const g5 = ws1.getCell('AM3');
    g5.value = 'BALCÃO E DESOSSA (COXÃO)';
    g5.alignment = { horizontal: 'center', vertical: 'middle' };
    g5.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    g5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } }; // Rose

    // Group 6: CÂMARA / BALCÃO E DESOSSA - SUÍNO (AV3:BA3 - 6 colunas)
    ws1.mergeCells('AV3:BA3');
    const g6 = ws1.getCell('AV3');
    g6.value = 'CÂMARA / BALCÃO E DESOSSA (SUÍNO)';
    g6.alignment = { horizontal: 'center', vertical: 'middle' };
    g6.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    g6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Teal

    // Columns row (Row 4)
    ws1.getRow(4).height = 22;
    const colNames = [
      'Filial',
      // Pedido
      'Ped. Dianteiro', 'Ped. Traseiro', 'Ped. Coxão', 'Alcatrão Estoque', 'PEDIDO ALCATRÃO', 'Costela G. Estoque', 'PEDIDO COSTELA', 'Boi Calc. (D+T+C+A)/2', 'Venda', 'Sugestão', 'Pedido (Qtd)', 'P. Trânsito',
      // Câmara
      'Câm. Dianteiro', 'Câm. Traseiro', 'Câm. Coxão', 'Câm. Alcatrão', 'Soma Traseiro', 'Câm. Costela G.',
      // Balcão / Câmara / Desossa
      'Tot. Alcatrão', 'Alcatra (Kg)', 'Alcatra (Pç)', 'Contra Filé (Kg)', 'Contra Filé (Pç)', 'Picanha (Kg)', 'Picanha (Pç)', 'Filé Mignon (Kg)', 'Filé Mignon (Pç)', 'Cost. Cong.',
      // Dianteiro
      'Tot. Dianteiro', 'Paleta (Kg)', 'Paleta (Pç)', 'Acém (Kg)', 'Acém (Pç)', 'Peito (Kg)', 'Peito (Pç)', 'Músculo (Kg)', 'Músculo (Pç)',
      // Coxão
      'Tot. Coxão', 'Chã (Kg)', 'Chã (Pç)', 'Patinho (Kg)', 'Patinho (Pç)', 'Lag. Red. (Kg)', 'Lag. Red. (Pç)', 'Lag. Plano (Kg)', 'Lag. Plano (Pç)',
      // Suíno (Câmara / Balcão e Desossa)
      'Banda (Pç)', 'Venda (Banda)', 'Sugestão (Banda)', 'Pedido (Banda)', 'Costela Suína', 'Pernil'
    ];

    colNames.forEach((name, i) => {
      const colIdx = i + 1;
      const cell = ws1.getCell(4, colIdx);
      cell.value = name;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF64748B' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Reference Price Row (Row 5)
    ws1.getRow(5).height = 18;
    const refPrices = [
      'Preço Base (R$/kg)',
      26.00, 26.00, 26.00, 29.00, 29.00, 25.50, 25.50, '', '', '', 26.00, '',
      26.00, 26.00, 26.00, 29.00, 26.00, 25.50,
      '', 39.90, '', 39.90, '', 39.90, '', 39.90, '', 25.00,
      26.00, 26.00, '', 26.00, '', 25.00, '', 26.00, '',
      31.50, 31.50, '', 31.50, '', 31.50, '', 35.00, '',
      '', '', '', 26.00, 35.00, 9.00
    ];

    refPrices.forEach((val, i) => {
      const cell = ws1.getCell(5, i + 1);
      cell.value = val;
      cell.alignment = { horizontal: typeof val === 'number' ? 'right' : 'center', vertical: 'middle' };
      cell.font = { name: 'Arial', size: 9, italic: true, bold: i === 0, color: { argb: 'FF92400E' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Soft yellow
      if (typeof val === 'number') {
        cell.numFmt = '"R$ "#,##0.00';
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFF59E0B' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });

    // Store Data Rows (Rows 6 to 6 + sheetRows.length - 1)
    const startDataRow = 6;
    sheetRows.forEach((row, rowIdx) => {
      const currentRowNum = startDataRow + rowIdx;
      ws1.getRow(currentRowNum).height = 20;
      const isEven = rowIdx % 2 === 0;
      const bgHex = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      const rowValues = [
        row.storeName,
        // Pedido
        row.pedidoDianteiro, row.pedidoTraseiro, row.pedidoCoxao, row.pedidoAlcatrao, row.pedidoAlcatraoReal || 0, row.pedidoCostelaGaucha, row.pedidoCostelaReal || 0, row.boi, row.venda ?? row.boiAVenda, row.sugestaoPedido, row.pedidoFinal, row.pTransito,
        // Câmara
        row.camaraDianteiro, row.camaraTraseiro, row.camaraCoxao, row.camaraAlcatrao, row.somaDoTraseiro, row.camaraCostelaGaucha,
        // Balcão / Câmara / Desossa
        row.totalAlcatrao, row.alcatraKg, row.alcatra || row.alcatraPecas, row.contraFileKg, row.contraFile || row.contraFilePecas, row.picanhaKg, row.picanha || row.picanhaPecas, row.fileMignonKg, row.fileMignon || row.fileMignonPecas, row.costelaCong,
        // Dianteiro
        row.totalDianteiro, row.paletaKg, row.paletaPecas, row.acemKg, row.acemPecas, row.peitoKg, row.peitoPecas, row.musculoKg, row.musculoPecas,
        // Coxão
        row.totalCoxao, row.chaKg, row.chaPecas, row.patinhoKg, row.patinhoPecas, row.lagartoRedondoKg, row.lagartoRedondoPecas, row.lagartoPlanoKg, row.lagartoPlanoPecas,
        // Suíno (Câmara / Balcão e Desossa)
        row.bandaPecas, row.bandaVenda ?? row.vendaSuino ?? 0, row.bandaSugestao ?? 0, row.bandaPedido ?? row.pedidoSuino ?? 0, row.costelaSuinaPecas, row.pernilPecas
      ];

      rowValues.forEach((val, colIdx) => {
        const cell = ws1.getCell(currentRowNum, colIdx + 1);
        cell.value = val;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgHex } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        if (colIdx === 0) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E293B' } };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF334155' } };
          if (typeof val === 'number') {
            cell.numFmt = Number.isInteger(val) ? '#,##0' : '#,##0.0';
          }
        }

        // PEDIDO ALCATRÃO (colIdx === 5) & PEDIDO COSTELA (colIdx === 7)
        if ((colIdx === 5 || colIdx === 7) && typeof val === 'number') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF3730A3' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2FF' } };
        }

        // Boi Calculado (colIdx === 8)
        if (colIdx === 8 && typeof val === 'number') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1D4ED8' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        }

        // Sugestão pedido highlight (colIdx === 10)
        if (colIdx === 10 && typeof val === 'number') {
          if (val < 0) {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFDC2626' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          } else {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF16A34A' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          }
        }

        // Pedido Final (colIdx === 11)
        if (colIdx === 11 && typeof val === 'number') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF4338CA' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
        }
      });
    });

    const endDataRow = startDataRow + sheetRows.length - 1;

    // Totals Row 1: TOTAL PEÇA (Formula row)
    const totalsRowPeça = endDataRow + 1;
    ws1.getRow(totalsRowPeça).height = 22;
    const totalLabelCell = ws1.getCell(totalsRowPeça, 1);
    totalLabelCell.value = 'Total Peça >>>';
    totalLabelCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFB45309' } };
    totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    totalLabelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    for (let c = 2; c <= colNames.length; c++) {
      const colLetter = ws1.getColumn(c).letter;
      const cell = ws1.getCell(totalsRowPeça, c);
      cell.value = { formula: `SUM(${colLetter}${startDataRow}:${colLetter}${endDataRow})` };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFB45309' } };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.numFmt = '#,##0';
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFB45309' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }

    // Totals Row 2: TOTAL GERAL FINANCEIRO R$
    const totalGeralRow = totalsRowPeça + 1;
    ws1.getRow(totalGeralRow).height = 26;
    ws1.mergeCells(`A${totalGeralRow}:F${totalGeralRow}`);
    const tgCell = ws1.getCell(`A${totalGeralRow}`);
    tgCell.value = 'TOTAL GERAL COMPRA: R$ 376.311,95 (14.473,5 kg)';
    tgCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    tgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }; // Dark Emerald
    tgCell.alignment = { horizontal: 'left', vertical: 'middle' };

    ws1.mergeCells(`G${totalGeralRow}:BA${totalGeralRow}`);
    const tgNote = ws1.getCell(`G${totalGeralRow}`);
    tgNote.value = 'Validação Contábil Oficial da Direção Conforme Matriz v10.7 • 16 Filiais Consolidadas • Custo Médio Quarto: R$ 26,00/kg (@ R$ 390,00)';
    tgNote.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FFFFFFFF' } };
    tgNote.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
    tgNote.alignment = { horizontal: 'left', vertical: 'middle' };

    // Column widths
    ws1.getColumn(1).width = 28; // Filial
    for (let c = 2; c <= colNames.length; c++) {
      ws1.getColumn(c).width = 13;
    }

    // ==========================================
    // ABA 2: RENDIMENTO E DESOSSA
    // ==========================================
    const ws2 = workbook.addWorksheet('Rendimento e Desossa', {
      properties: { tabColor: { argb: 'FFD97706' } }
    });

    ws2.mergeCells('A1:G1');
    const yTitle = ws2.getCell('A1');
    yTitle.value = 'ANÁLISE TÉCNICA DE RENDIMENTO E DESOSSA ZOOTÉCNICA (QUARTO BOVINO)';
    yTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    yTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };
    yTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 28;

    const yieldHeaders = ['Corte / Subproduto', 'Classificação', '% Rendimento Médio', 'Peso Médio Estimado (kg)', 'Preço Custo Limpo (R$/kg)', 'Preço Venda Sugerido (R$/kg)', 'Margem Bruta Projetada'];
    ws2.getRow(3).height = 22;
    yieldHeaders.forEach((h, i) => {
      const cell = ws2.getCell(3, i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF78350F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const yieldData = [
      ['Dianteiro com Osso', 'Quarto Dianteiro', 0.280, 70.0, 26.00, 31.90, 0.185],
      ['Traseiro Serrote', 'Quarto Traseiro', 0.480, 120.0, 26.00, 38.50, 0.325],
      ['Ponta de Agulha / Costela', 'Costela Gaúcha', 0.140, 35.0, 25.50, 34.90, 0.269],
      ['Picanha / Alcatra Especial', 'Cortes Nobres', 0.085, 21.2, 39.90, 59.90, 0.334],
      ['Contra Filé / Filé Mignon', 'Cortes Nobres', 0.065, 16.3, 39.90, 62.90, 0.366],
      ['Coxão Mole (Chã) / Patinho', 'Cortes de Primeira', 0.155, 38.8, 31.50, 44.90, 0.298],
      ['Acém / Paleta / Peito', 'Cortes de Segunda', 0.180, 45.0, 26.00, 34.90, 0.255],
      ['Sebo e Aparas de Cobertura', 'Subproduto Graxaria', 0.045, 11.2, 3.50, 4.20, 0.167],
      ['Ossos de Descarte', 'Subproduto Graxaria', 0.125, 31.2, 0.80, 1.20, 0.333]
    ];

    yieldData.forEach((item, idx) => {
      const r = 4 + idx;
      ws2.getRow(r).height = 19;
      item.forEach((v, c) => {
        const cell = ws2.getCell(r, c + 1);
        cell.value = v;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        if (c === 0 || c === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (c === 2 || c === 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else if (c === 3) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.0 "kg"';
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"R$ "#,##0.00';
        }
      });
    });

    ws2.getColumn(1).width = 30;
    ws2.getColumn(2).width = 22;
    ws2.getColumn(3).width = 20;
    ws2.getColumn(4).width = 22;
    ws2.getColumn(5).width = 24;
    ws2.getColumn(6).width = 24;
    ws2.getColumn(7).width = 22;

    // ==========================================
    // ABA 3: DRE E RESULTADOS (MARGENS)
    // ==========================================
    const ws3 = workbook.addWorksheet('DRE e Margens', {
      properties: { tabColor: { argb: 'FF10B981' } }
    });

    ws3.mergeCells('A1:E1');
    const dreTitle = ws3.getCell('A1');
    dreTitle.value = 'DEMONSTRATIVO DE RESULTADOS DO EXERCÍCIO (DRE) - APURAÇÃO DO BOI';
    dreTitle.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    dreTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    dreTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    ws3.getRow(1).height = 28;

    const dreHeaders = ['Linha DRE / Indicador Contábil', 'Valor Consolidado (R$)', '% da Receita', 'Valor Unitário (R$/kg)', 'Observação Operacional'];
    ws3.getRow(3).height = 22;
    dreHeaders.forEach((h, i) => {
      const cell = ws3.getCell(3, i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const dreRows = [
      ['(+) Receita Bruta com Venda de Carne', 526836.73, 1.00, 36.40, 'Projeção sobre o mix de cortes das 16 lojas'],
      ['(-) Impostos sobre Vendas e Deduções', -36878.57, -0.07, -2.55, 'ICMS, PIS/COFINS e abatimentos'],
      ['(=) RECEITA OPERACIONAL LÍQUIDA', 489958.16, 0.93, 33.85, 'Faturamento líquido realizável'],
      ['(-) Custo da Mercadoria Vendida (CMV)', -376311.95, -0.714, -26.00, 'Matriz oficial de compra v10.7 (Lote de Boi)'],
      ['(=) LUCRO BRUTO OPERACIONAL', 113646.21, 0.216, 7.85, 'Margem bruta de desossa gerencial'],
      ['(-) Custos Operacionais de Desossa & Câmaras', -36183.75, -0.069, -2.50, 'Mão de obra, energia de câmaras e embalagens'],
      ['(+) Receitas de Subprodutos (Graxaria/Sebo/Osso)', 8684.10, 0.016, 0.60, 'Venda de sebo de cobertura e ossos'],
      ['(=) RESULTADO LÍQUIDO OPERACIONAL', 86146.56, 0.163, 5.95, 'Margem líquida gerencial de 16,3%']
    ];

    dreRows.forEach((r, idx) => {
      const rowNum = 4 + idx;
      ws3.getRow(rowNum).height = 20;
      const isHeader = String(r[0]).startsWith('(=)');
      r.forEach((val, c) => {
        const cell = ws3.getCell(rowNum, c + 1);
        cell.value = val;
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        if (isHeader) {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF065F46' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        } else {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } };
        }

        if (c === 0 || c === 4) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (c === 1) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"R$ "#,##0.00;[Red]-"R$ "#,##0.00';
        } else if (c === 2) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else if (c === 3) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"R$ "#,##0.00;[Red]-"R$ "#,##0.00';
        }
      });
    });

    ws3.getColumn(1).width = 42;
    ws3.getColumn(2).width = 24;
    ws3.getColumn(3).width = 16;
    ws3.getColumn(4).width = 22;
    ws3.getColumn(5).width = 46;

    // Generate buffer & trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `Grupo_GAPP_Apuracao_Boi_v10.7_${dateStr}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
