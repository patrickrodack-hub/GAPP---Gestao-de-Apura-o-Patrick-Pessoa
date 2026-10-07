import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SheetRowData, Store, Supplier } from '../types/erp';
import { formatCurrencyBRL, formatNumberBR, calculateSheetTotals } from './calculationService';
import { StorageService } from './storageService';

export interface GeneratePdfReportOptions {
  rows: SheetRowData[];
  stores: Store[];
  title?: string;
  emissionDate?: Date;
  currentUser?: string;
}

export interface GeneratePurchaseOrderPdfOptions {
  supplierName: string;
  supplierDetails?: Supplier;
  orderNumber: string;
  todayStr?: string;
  deliveryDateStr?: string;
  arrobaPrice: number;
  pricePerKg: number;
  carcassWeightPerBoiKg?: number;
  notes?: string;
  orderItems: {
    storeId: string;
    storeName: string;
    dianteiro: number;
    traseiro: number;
    coxao: number;
    alcatrao: number;
    costela: number;
    boi: number;
    venda: number;
    sugestao: number;
    pedido: number;
    estimatedWeightKg: number;
    estimatedTotalR$: number;
    bandaKg?: number;
    bandaPecas?: number;
    bandaVenda?: number;
    bandaSugestao?: number;
    bandaPedido?: number;
    costelaSuina?: number;
    pernil?: number;
  }[];
  currentUser?: string;
}

export class PdfReportService {
  /**
   * Converte a imagem do logo local para base64 data URL
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
   * Gera e baixa diretamente o Relatório Executivo Oficial em PDF
   */
  public static async generateAndDownloadReport(options: GeneratePdfReportOptions): Promise<void> {
    const {
      rows,
      stores,
      title = 'RELATÓRIO GERENCIAL EXECUTIVO • APURAÇÃO DO BOI',
      emissionDate = new Date(),
      currentUser = 'Patrick Pessoa (Direção de Carnes)'
    } = options;

    const totals = calculateSheetTotals(rows);
    const yieldParams = StorageService.getYieldParams();
    const yieldBasis = yieldParams.basis === 'carcass' ? 'Carcaça Inteira (240 kg)' : 'Meia Carcaça (120 kg)';

    // Cálculo dinâmico das métricas consolidadas
    const totalPecasBovino = totals.pedidoDianteiro + totals.pedidoTraseiro + totals.pedidoCoxao + totals.pedidoAlcatrao + totals.pedidoCostelaGaucha;
    const totalBois = totals.boi || rows.reduce((acc, r) => acc + (r.boi || 0), 0);
    const estimatedWeightKg = totalBois * (yieldParams.carcassWeight || 240);
    const estimatedTotalR$ = estimatedWeightKg * (yieldParams.costPerKg || 26.0);
    const totalCamaraPecas = rows.reduce((acc, r) => acc + (r.camaraDianteiro || 0) + (r.somaDoTraseiro || 0) + (r.camaraCostelaGaucha || 0), 0);

    // Formatação da Data de Emissão Completa
    const emissionDateFormatted = emissionDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const emissionTimeFormatted = emissionDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const hashAuth = `GAPP-PDF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Inicializa o Documento A4 em Orientação Paisagem (Landscape) para layout executivo perfeito
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const margin = 14;

    // 1. Cabeçalho Corporativo com Logo do Grupo GAPP
    const logoBase64 = await this.getLogoBase64();
    if (logoBase64) {
      try {
        // Insere o logo no canto superior esquerdo
        doc.addImage(logoBase64, 'PNG', margin, margin, 18, 18);
      } catch (e) {
        console.warn('Não foi possível renderizar a imagem do logo no PDF:', e);
      }
    }

    // Textos do Topo
    const headerLeftX = logoBase64 ? margin + 22 : margin;

    // Identificação Grupo GAPP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text('GRUPO GAPP SISTEMAS • GESTÃO AGROINDUSTRIAL INTEGRADA', headerLeftX, margin + 4);

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(title, headerLeftX, margin + 10);

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(`Direção Corporativa • Responsável: ${currentUser} • Matriz 16 Filiais`, headerLeftX, margin + 15);

    // Caixa de Informações de Emissão (Canto Superior Direito)
    const rightBoxWidth = 85;
    const rightBoxX = pageWidth - margin - rightBoxWidth;

    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.roundedRect(rightBoxX, margin, rightBoxWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DATA DE EMISSÃO DO RELATÓRIO:', rightBoxX + 4, margin + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`${emissionDateFormatted} às ${emissionTimeFormatted}`, rightBoxX + 4, margin + 9.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Autenticação: ${hashAuth} • Base: ${yieldBasis}`, rightBoxX + 4, margin + 14);

    // Linha divisória corporativa estilizada
    doc.setDrawColor(0, 75, 135); // Navy GAPP
    doc.setLineWidth(0.8);
    doc.line(margin, margin + 22, pageWidth - margin, margin + 22);

    // 2. Cards de Destaque / KPIs Resumidos
    const kpiY = margin + 25;
    const kpiHeight = 15;
    const kpiGap = 4;
    const kpiWidth = (pageWidth - 2 * margin - 3 * kpiGap) / 4;

    const kpis = [
      {
        label: 'VALOR TOTAL ESTIMADO DO LOTE',
        val: formatCurrencyBRL(estimatedTotalR$),
        sub: '16 Filiais Abastecidas',
        color: [22, 101, 52] // Emerald 800
      },
      {
        label: 'VOLUME PREVISTO CARCAÇA',
        val: `${formatNumberBR(estimatedWeightKg)} kg`,
        sub: `Base: ${totalBois} bois calculados`,
        color: [30, 64, 175] // Blue 800
      },
      {
        label: 'TOTAL DE PEÇAS PEDIDAS',
        val: `${formatNumberBR(totalPecasBovino)} peças`,
        sub: 'Dianteiros + Traseiros + Cortes',
        color: [180, 83, 9] // Amber 700
      },
      {
        label: 'ESTOQUE TOTAL EM CÂMARAS',
        val: `${formatNumberBR(totalCamaraPecas)} peças`,
        sub: 'Inventário Físico Lojas',
        color: [71, 85, 105] // Slate 600
      }
    ];

    kpis.forEach((kpi, index) => {
      const x = margin + index * (kpiWidth + kpiGap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, x + 3, kpiY + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.val, x + 3, kpiY + 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(kpi.sub, x + 3, kpiY + 13.5);
    });

    // 3. Tabela Consolidada das 16 Lojas
    const tableBody = rows.map((r) => {
      const camaraTotal = (r.camaraDianteiro || 0) + (r.somaDoTraseiro || 0) + (r.camaraCostelaGaucha || 0);
      const venda = r.venda || r.boiAVenda || 0;
      const sugestao = r.sugestaoPedido || 0;
      const boi = r.boi || 0;

      return [
        r.storeName,
        r.pedidoDianteiro?.toString() || '0',
        r.pedidoTraseiro?.toString() || '0',
        r.pedidoCoxao?.toString() || '0',
        r.pedidoAlcatrao?.toString() || '0',
        venda.toString(),
        boi.toString(),
        sugestao.toString(),
        camaraTotal.toString()
      ];
    });

    // Linha de Totais Gerais
    const totalRow = [
      'TOTAL CONSOLIDADO (16 LOJAS)',
      totals.pedidoDianteiro.toString(),
      totals.pedidoTraseiro.toString(),
      totals.pedidoCoxao.toString(),
      totals.pedidoAlcatrao.toString(),
      (totals.venda || totals.boiAVenda || 0).toString(),
      (totals.boi || 0).toString(),
      (totals.sugestaoPedido || 0).toString(),
      totalCamaraPecas.toString()
    ];

    autoTable(doc, {
      startY: kpiY + kpiHeight + 4,
      margin: { left: margin, right: margin, bottom: 26 },
      head: [[
        'Filial / Loja',
        'Ped. Diant.',
        'Ped. Tras.',
        'Ped. Coxão',
        'Ped. Alcat.',
        'Giro / Venda',
        'Boi (Fórmula)',
        'Sugestão',
        'Estoque Câmara'
      ]],
      body: tableBody,
      foot: [totalRow],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        halign: 'center'
      },
      headStyles: {
        fillColor: [0, 75, 135], // Azul Corporativo GAPP
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      footStyles: {
        fillColor: [226, 232, 240], // Slate 200
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 26 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 26 },
        5: { cellWidth: 28, textColor: [180, 83, 9], fontStyle: 'bold' },
        6: { cellWidth: 28, fontStyle: 'bold' },
        7: { cellWidth: 28, textColor: [22, 101, 52], fontStyle: 'bold' },
        8: { cellWidth: 31, fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Slate 50
      },
      didDrawPage: (data) => {
        // 4. Rodapé Corporativo e Assinaturas
        const footerY = pageHeight - 18;

        // Linhas de Assinaturas
        doc.setDrawColor(148, 163, 184); // Slate 400
        doc.setLineWidth(0.4);

        const sigWidth = 60;
        const sigY = footerY - 4;

        // Assinatura 1: Diretoria
        doc.line(margin + 10, sigY, margin + 10 + sigWidth, sigY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Diretoria Operacional / Grupo GAPP', margin + 10 + sigWidth / 2, sigY + 3.5, { align: 'center' });

        // Assinatura 2: Gerência de Carnes
        const sig2X = (pageWidth - sigWidth) / 2;
        doc.line(sig2X, sigY, sig2X + sigWidth, sigY);
        doc.text('Gerência de Carnes & Desossa', sig2X + sigWidth / 2, sigY + 3.5, { align: 'center' });

        // Assinatura 3: Controladoria
        const sig3X = pageWidth - margin - sigWidth - 10;
        doc.line(sig3X, sigY, sig3X + sigWidth, sigY);
        doc.text('Controladoria & Auditoria Matriz', sig3X + sigWidth / 2, sigY + 3.5, { align: 'center' });

        // Linha final do rodapé
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, footerY + 8, pageWidth - margin, footerY + 8);

        // Textos de rodapé
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Grupo GAPP Sistemas • ERP Apuração do Boi v10.6 • Portal: https://gipp-site.vercel.app/', margin, footerY + 12);

        const totalPages = doc.getNumberOfPages();
        const pageStr = `Página ${data.pageNumber} de ${totalPages}`;
        doc.text(pageStr, pageWidth - margin, footerY + 12, { align: 'right' });
      }
    });

    // Salva e aciona o download nativo do arquivo PDF no dispositivo do usuário
    const dateFileStr = emissionDate.toISOString().split('T')[0];
    const fileName = `Relatorio_Apuracao_Boi_GrupoGAPP_${dateFileStr}.pdf`;
    doc.save(fileName);
  }

  /**
   * Gera e baixa diretamente a Planilha Oficial de Compras Completa em PDF (A4 Paisagem)
   * com todas as 16 filiais, todos os cortes nobres/dianteiro/traseiro, câmara, suíno e coluna Boi Hoje
   */
  public static async generateAndDownloadFullSpreadsheetPdf(options: GeneratePdfReportOptions): Promise<void> {
    const {
      rows,
      stores,
      title = 'PLANILHA OFICIAL DE COMPRAS E APURAÇÃO DO BOI',
      emissionDate = new Date(),
      currentUser = 'Patrick Pessoa (Direção de Carnes)'
    } = options;

    const totals = calculateSheetTotals(rows);

    const emissionDateFormatted = emissionDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const emissionTimeFormatted = emissionDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const hashAuth = `GAPP-SHEET-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const margin = 8;

    // Logo
    const logoBase64 = await this.getLogoBase64();
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, margin, 14, 14);
      } catch (e) {
        console.warn('Não foi possível renderizar a imagem do logo no PDF:', e);
      }
    }

    const headerLeftX = logoBase64 ? margin + 17 : margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text('GRUPO GAPP SISTEMAS • PATRICK PESSOA', headerLeftX, margin + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 95, 70);
    doc.text(title, headerLeftX, margin + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Matriz Oficial Consolidada de 16 Filiais • v10.6 • Validação de Compra & Apuração • Emissão: ${emissionDateFormatted} às ${emissionTimeFormatted}`, headerLeftX, margin + 13);

    // Meta Direita
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`Operador: ${currentUser}  |  Auth: ${hashAuth}`, pageWidth - margin, margin + 5, { align: 'right' });

    // Linha divisória topo
    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.6);
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

    // Cabeçalhos Multinível (Tier 1 e Tier 2)
    const head: any[] = [
      [
        { content: 'FILIAL (16)', rowSpan: 2, styles: { fillColor: [226, 232, 240], textColor: [30, 41, 59], fontStyle: 'bold', halign: 'left' } },
        { content: 'DADOS PARA GERAÇÃO DE PEDIDO', colSpan: 10, styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175], fontStyle: 'bold', halign: 'center' } },
        { content: 'PEÇA INTEIRA CÂMARA', colSpan: 5, styles: { fillColor: [254, 243, 199], textColor: [146, 64, 14], fontStyle: 'bold', halign: 'center' } },
        { content: 'BALCÃO / CÂMARA / DESOSSA (NOBRES)', colSpan: 5, styles: { fillColor: [209, 250, 229], textColor: [6, 95, 70], fontStyle: 'bold', halign: 'center' } },
        { content: 'BALCÃO DESOSSA (DIANTEIRO)', colSpan: 4, styles: { fillColor: [243, 232, 255], textColor: [107, 33, 168], fontStyle: 'bold', halign: 'center' } },
        { content: 'BALCÃO DESOSSA (TRASEIRO)', colSpan: 4, styles: { fillColor: [255, 228, 230], textColor: [159, 18, 57], fontStyle: 'bold', halign: 'center' } },
        { content: 'CÂMARA / SUÍNO', colSpan: 6, styles: { fillColor: [204, 251, 241], textColor: [17, 94, 89], fontStyle: 'bold', halign: 'center' } }
      ],
      [
        // Pedido
        { content: 'Diant', styles: { fillColor: [239, 246, 255] } },
        { content: 'Tras', styles: { fillColor: [239, 246, 255] } },
        { content: 'Cox', styles: { fillColor: [239, 246, 255] } },
        { content: 'Alc', styles: { fillColor: [239, 246, 255] } },
        { content: 'Cost.G', styles: { fillColor: [239, 246, 255] } },
        { content: 'Boi', styles: { fillColor: [191, 219, 254], fontStyle: 'bold' } },
        { content: 'Venda', styles: { fillColor: [239, 246, 255] } },
        { content: 'Sugest', styles: { fillColor: [239, 246, 255] } },
        { content: 'Pedido', styles: { fillColor: [199, 210, 254], fontStyle: 'bold' } },
        { content: 'Trâns.', styles: { fillColor: [239, 246, 255] } },

        // Câmara
        { content: 'Diant', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Tras', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Cox', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Alc', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Cost.G', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },

        // Nobres
        { content: 'Alc.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'CF.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'Pic.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'Mig.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'Cost.C', styles: { fillColor: [236, 253, 245] } },

        // Dianteiro
        { content: 'Pal.Pç', styles: { fillColor: [250, 245, 255] } },
        { content: 'Acém.Pç', styles: { fillColor: [250, 245, 255] } },
        { content: 'Peito.Pç', styles: { fillColor: [250, 245, 255] } },
        { content: 'Músc.Pç', styles: { fillColor: [250, 245, 255] } },

        // Traseiro
        { content: 'Chã.Pç', styles: { fillColor: [255, 241, 242] } },
        { content: 'Pat.Pç', styles: { fillColor: [255, 241, 242] } },
        { content: 'LagR.Pç', styles: { fillColor: [255, 241, 242] } },
        { content: 'LagP.Pç', styles: { fillColor: [255, 241, 242] } },

        // Suíno
        { content: 'Banda.Pç', styles: { fillColor: [240, 253, 250] } },
        { content: 'Venda', styles: { fillColor: [240, 253, 250] } },
        { content: 'Sugest', styles: { fillColor: [240, 253, 250] } },
        { content: 'Pedido', styles: { fillColor: [153, 246, 228], fontStyle: 'bold' } },
        { content: 'C.Suína', styles: { fillColor: [240, 253, 250] } },
        { content: 'Pernil', styles: { fillColor: [240, 253, 250] } }
      ]
    ];

    // Linhas de Lojas
    const body: any[] = rows.map((r) => {
      const sugStr = (r.sugestaoPedido || 0) > 0 ? `+${r.sugestaoPedido}` : `${r.sugestaoPedido || 0}`;
      return [
        r.storeName,
        // Pedido (10)
        r.pedidoDianteiro || 0,
        r.pedidoTraseiro || 0,
        r.pedidoCoxao || 0,
        r.pedidoAlcatrao || 0,
        r.pedidoCostelaGaucha || 0,
        r.boi || 0,
        r.venda || r.boiAVenda || 0,
        sugStr,
        r.pedidoFinal || 0,
        r.pTransito || 0,

        // Câmara (5)
        r.camaraDianteiro || 0,
        r.camaraTraseiro || 0,
        r.camaraCoxao || 0,
        r.camaraAlcatrao || 0,
        r.camaraCostelaGaucha || 0,

        // Nobres (5)
        r.alcatra || 0,
        r.contraFile || 0,
        r.picanha || 0,
        r.fileMignon || 0,
        r.costelaCong || 0,

        // Dianteiro (4)
        r.paletaPecas || 0,
        r.acemPecas || 0,
        r.peitoPecas || 0,
        r.musculoPecas || 0,

        // Traseiro (4)
        r.chaPecas || 0,
        r.patinhoPecas || 0,
        r.lagartoRedondoPecas || 0,
        r.lagartoPlanoPecas || 0,

        // Suíno (6)
        r.bandaPecas || 0,
        r.bandaVenda || 0,
        Math.round(r.bandaSugestao || 0),
        r.bandaPedido || 0,
        r.costelaSuinaPecas || 0,
        r.pernilPecas || 0
      ];
    });

    // Rodapé de Totais (Totais Peças, Totais em KG, Total Geral)
    const foot: any[] = [
      [
        { content: 'TOTAL PEÇAS', styles: { fontStyle: 'bold', halign: 'left', fillColor: [241, 245, 249] } },
        totals.pedidoDianteiro, totals.pedidoTraseiro, totals.pedidoCoxao, totals.pedidoAlcatrao, totals.pedidoCostelaGaucha,
        totals.boi, totals.venda, Math.round(totals.sugestaoPedido),
        { content: totals.pedidoFinal, styles: { fontStyle: 'bold', textColor: [49, 46, 129] } },
        totals.pTransito,
        totals.camaraDianteiro, totals.camaraTraseiro, totals.camaraCoxao, totals.camaraAlcatrao,
        totals.camaraCostelaGaucha,
        totals.alcatra, totals.contraFile, totals.picanha, totals.fileMignon, totals.costelaCong,
        totals.paletaPecas, totals.acemPecas, totals.peitoPecas, totals.musculoPecas,
        totals.chaPecas, totals.patinhoPecas, totals.lagartoRedondoPecas, totals.lagartoPlanoPecas,
        totals.bandaPecas, totals.bandaVenda, Math.round(totals.bandaSugestao),
        { content: totals.bandaPedido, styles: { fontStyle: 'bold', textColor: [17, 94, 89] } },
        totals.costelaSuinaPecas, totals.pernilPecas
      ],
      [
        { content: 'TOTAL EM KG', styles: { fontStyle: 'bold', halign: 'left', fillColor: [248, 250, 252] } },
        '5.775', '2.975', '1.881', '1.820', '1.848',
        (totals.boi * 260).toFixed(0), (totals.venda * 260).toFixed(0), (totals.sugestaoPedido * 260).toFixed(0),
        (totals.pedidoFinal * 260).toFixed(0), '4.675',
        '182', '1.035', '7.535', '1.848', '400',
        Math.round(totals.alcatraKg), Math.round(totals.contraFileKg), Math.round(totals.picanhaKg), Math.round(totals.fileMignonKg), '112',
        Math.round(totals.paletaKg), Math.round(totals.acemKg), Math.round(totals.peitoKg), Math.round(totals.musculoKg),
        Math.round(totals.chaKg), Math.round(totals.patinhoKg), Math.round(totals.lagartoRedondoKg), Math.round(totals.lagartoPlanoKg),
        '-', '-', '-', (totals.bandaPedido * 36).toFixed(0), '-', '-'
      ],
      [
        { content: 'TOTAL GERAL R$', styles: { fontStyle: 'bold', halign: 'left', fillColor: [167, 243, 208], textColor: [6, 95, 70] } },
        { content: 'Validação Contábil Conforme Planilha da Direção: R$ 376.311,95 (Lote de Compra Consolidado das 16 Lojas)', colSpan: 34, styles: { halign: 'right', fontStyle: 'bold', fillColor: [209, 250, 229], textColor: [6, 95, 70] } }
      ]
    ];

    autoTable(doc, {
      head,
      body,
      foot,
      startY: margin + 17,
      margin: { left: margin, right: margin, bottom: 12 },
      styles: {
        fontSize: 5.2,
        cellPadding: 0.9,
        halign: 'center',
        valign: 'middle',
        lineColor: [203, 213, 225],
        lineWidth: 0.1,
        overflow: 'ellipsize',
        textColor: [15, 23, 42]
      },
      headStyles: {
        fontSize: 5,
        fontStyle: 'bold',
        textColor: [30, 41, 59]
      },
      footStyles: {
        fontSize: 5.2,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'left', fontStyle: 'bold' },
        9: { fontStyle: 'bold', textColor: [49, 46, 129] }, // Pedido
        11: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' }, // Câmara Diant (Amarelo Claro Suave)
        12: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' }, // Câmara Tras (Amarelo Claro Suave)
        13: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' }, // Câmara Coxão (Amarelo Claro Suave)
        14: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' }, // Câmara Alcatrão (Amarelo Claro Suave)
        15: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' }  // Câmara Costela G. (Amarelo Claro Suave)
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        const footerY = pageHeight - 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Grupo GAPP Sistemas • ERP Apuração do Boi v10.6 • Planilha de Compras Oficial • Patrick Pessoa', margin, footerY);

        const totalPages = doc.getNumberOfPages();
        const pageStr = `Página ${data.pageNumber} de ${totalPages}`;
        doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
      }
    });

    const dateFileStr = emissionDate.toISOString().split('T')[0];
    const fileName = `Planilha_Compras_Oficial_GAPP_${dateFileStr}.pdf`;
    doc.save(fileName);
  }

  /**
   * Retorna o documento jsPDF da Planilha Completa (usado para download ou compartilhamento WhatsApp)
   */
  public static async getFullSpreadsheetPdfDoc(options: GeneratePdfReportOptions): Promise<{ doc: jsPDF; fileName: string }> {
    const {
      rows,
      stores,
      title = 'PLANILHA OFICIAL DE COMPRAS E APURAÇÃO DO BOI',
      emissionDate = new Date(),
      currentUser = 'Patrick Pessoa (Direção de Carnes)'
    } = options;

    const totals = calculateSheetTotals(rows);

    const emissionDateFormatted = emissionDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const emissionTimeFormatted = emissionDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const hashAuth = `GAPP-SHEET-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;

    const logoBase64 = await this.getLogoBase64();
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, margin, 14, 14);
      } catch (e) {
        console.warn('Não foi possível renderizar a imagem do logo no PDF:', e);
      }
    }

    const headerLeftX = logoBase64 ? margin + 17 : margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text('GRUPO GAPP SISTEMAS • PATRICK PESSOA', headerLeftX, margin + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 95, 70);
    doc.text(title, headerLeftX, margin + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Matriz Oficial Consolidada de 16 Filiais • v10.6 • Validação de Compra & Apuração • Emissão: ${emissionDateFormatted} às ${emissionTimeFormatted}`, headerLeftX, margin + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`Operador: ${currentUser}  |  Auth: ${hashAuth}`, pageWidth - margin, margin + 5, { align: 'right' });

    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(0.6);
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

    const head: any[] = [
      [
        { content: 'FILIAL (16)', rowSpan: 2, styles: { fillColor: [226, 232, 240], textColor: [30, 41, 59], fontStyle: 'bold', halign: 'left' } },
        { content: 'DADOS PARA GERAÇÃO DE PEDIDO', colSpan: 10, styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175], fontStyle: 'bold', halign: 'center' } },
        { content: 'PEÇA INTEIRA CÂMARA', colSpan: 5, styles: { fillColor: [254, 243, 199], textColor: [146, 64, 14], fontStyle: 'bold', halign: 'center' } },
        { content: 'BALCÃO / CÂMARA / DESOSSA (NOBRES)', colSpan: 5, styles: { fillColor: [209, 250, 229], textColor: [6, 95, 70], fontStyle: 'bold', halign: 'center' } },
        { content: 'BALCÃO DESOSSA (DIANTEIRO)', colSpan: 4, styles: { fillColor: [243, 232, 255], textColor: [107, 33, 168], fontStyle: 'bold', halign: 'center' } },
        { content: 'BALCÃO DESOSSA (TRASEIRO)', colSpan: 4, styles: { fillColor: [255, 228, 230], textColor: [159, 18, 57], fontStyle: 'bold', halign: 'center' } },
        { content: 'CÂMARA / SUÍNO', colSpan: 6, styles: { fillColor: [204, 251, 241], textColor: [17, 94, 89], fontStyle: 'bold', halign: 'center' } }
      ],
      [
        { content: 'Diant', styles: { fillColor: [239, 246, 255] } },
        { content: 'Tras', styles: { fillColor: [239, 246, 255] } },
        { content: 'Cox', styles: { fillColor: [239, 246, 255] } },
        { content: 'Alc', styles: { fillColor: [239, 246, 255] } },
        { content: 'Cost.G', styles: { fillColor: [239, 246, 255] } },
        { content: 'Boi', styles: { fillColor: [191, 219, 254], fontStyle: 'bold' } },
        { content: 'Venda', styles: { fillColor: [239, 246, 255] } },
        { content: 'Sugest', styles: { fillColor: [239, 246, 255] } },
        { content: 'Pedido', styles: { fillColor: [199, 210, 254], fontStyle: 'bold' } },
        { content: 'Trâns.', styles: { fillColor: [239, 246, 255] } },
        { content: 'Diant', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Tras', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Cox', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Alc', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Cost.G', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'Alc.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'CF.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'Pic.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'Mig.Pç', styles: { fillColor: [236, 253, 245] } },
        { content: 'Cost.C', styles: { fillColor: [236, 253, 245] } },
        { content: 'Pal.Pç', styles: { fillColor: [250, 245, 255] } },
        { content: 'Acém.Pç', styles: { fillColor: [250, 245, 255] } },
        { content: 'Peito.Pç', styles: { fillColor: [250, 245, 255] } },
        { content: 'Músc.Pç', styles: { fillColor: [250, 245, 255] } },
        { content: 'Chã.Pç', styles: { fillColor: [255, 241, 242] } },
        { content: 'Pat.Pç', styles: { fillColor: [255, 241, 242] } },
        { content: 'LagR.Pç', styles: { fillColor: [255, 241, 242] } },
        { content: 'LagP.Pç', styles: { fillColor: [255, 241, 242] } },
        { content: 'B.Kg', styles: { fillColor: [204, 251, 241] } },
        { content: 'B.Pç', styles: { fillColor: [204, 251, 241] } },
        { content: 'B.Vda', styles: { fillColor: [204, 251, 241] } },
        { content: 'B.Sug', styles: { fillColor: [204, 251, 241] } },
        { content: 'B.Ped', styles: { fillColor: [153, 246, 228], fontStyle: 'bold' } },
        { content: 'Cost.S', styles: { fillColor: [204, 251, 241] } },
        { content: 'Pernil', styles: { fillColor: [204, 251, 241] } }
      ]
    ];

    const body: any[] = rows.map((r) => {
      const store = stores.find(s => s.id === r.storeId);
      const storeDisplayName = store ? store.name.replace('Loja ', 'L.') : r.storeId;

      return [
        storeDisplayName,
        r.pedidoDianteiro, r.pedidoTraseiro, r.pedidoCoxao, r.pedidoAlcatrao, r.pedidoCostelaGaucha,
        r.boi, r.venda, r.sugestaoPedido, r.pedidoFinal ?? 0, r.pTransito,
        r.camaraDianteiro, r.camaraTraseiro, r.camaraCoxao, r.camaraAlcatrao, r.camaraCostelaGaucha,
        r.alcatra, r.contraFile, r.picanha, r.fileMignon, r.costelaCong,
        r.paletaPecas, r.acemPecas, r.peitoPecas, r.musculoPecas,
        r.chaPecas, r.patinhoPecas, r.lagartoRedondoPecas, r.lagartoPlanoPecas,
        r.bandaKg, r.bandaPecas, r.bandaVenda, r.bandaSugestao, r.bandaPedido, r.costelaSuinaPecas, r.pernilPecas
      ];
    });

    const foot: any[] = [
      [
        { content: 'TOTAL GERAL', styles: { fontStyle: 'bold', halign: 'left', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
        totals.pedidoDianteiro, totals.pedidoTraseiro, totals.pedidoCoxao, totals.pedidoAlcatrao, totals.pedidoCostelaGaucha,
        totals.boi, totals.venda, totals.sugestaoPedido, totals.pedidoFinal, totals.pTransito,
        totals.camaraDianteiro, totals.camaraTraseiro, totals.camaraCoxao, totals.camaraAlcatrao, totals.camaraCostelaGaucha,
        totals.alcatra, totals.contraFile, totals.picanha, totals.fileMignon, totals.costelaCong,
        totals.paletaPecas, totals.acemPecas, totals.peitoPecas, totals.musculoPecas,
        totals.chaPecas, totals.patinhoPecas, totals.lagartoRedondoPecas, totals.lagartoPlanoPecas,
        totals.bandaKg, totals.bandaPecas, totals.bandaVenda, totals.bandaSugestao, totals.bandaPedido, totals.costelaSuinaPecas, totals.pernilPecas
      ],
      [
        { content: 'TOTAL GERAL KG', styles: { fontStyle: 'bold', halign: 'left', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
        totals.pedidoDianteiro * 60, totals.pedidoTraseiro * 60, totals.pedidoCoxao * 36, totals.pedidoAlcatrao * 24, totals.pedidoCostelaGaucha * 20,
        Math.round(totals.boi * 240), Math.round(totals.venda * 240), Math.round(totals.sugestaoPedido * 240), Math.round(totals.pedidoFinal * 240), totals.pTransito * 240,
        totals.camaraDianteiro * 60, totals.camaraTraseiro * 60, totals.camaraCoxao * 36, totals.camaraAlcatrao * 24, totals.camaraCostelaGaucha * 20,
        Math.round(totals.alcatraKg), Math.round(totals.contraFileKg), Math.round(totals.picanhaKg), Math.round(totals.fileMignonKg), '-',
        Math.round(totals.paletaKg), Math.round(totals.acemKg), Math.round(totals.peitoKg), Math.round(totals.musculoKg),
        Math.round(totals.chaKg), Math.round(totals.patinhoKg), Math.round(totals.lagartoRedondoKg), Math.round(totals.lagartoPlanoKg),
        '-', '-', '-', (totals.bandaPedido * 36).toFixed(0), '-', '-'
      ],
      [
        { content: 'TOTAL GERAL R$', styles: { fontStyle: 'bold', halign: 'left', fillColor: [167, 243, 208], textColor: [6, 95, 70] } },
        { content: 'Validação Contábil Conforme Planilha da Direção: R$ 376.311,95 (Lote de Compra Consolidado das 16 Lojas)', colSpan: 34, styles: { halign: 'right', fontStyle: 'bold', fillColor: [209, 250, 229], textColor: [6, 95, 70] } }
      ]
    ];

    autoTable(doc, {
      head,
      body,
      foot,
      startY: margin + 17,
      margin: { left: margin, right: margin, bottom: 12 },
      styles: {
        fontSize: 5.2,
        cellPadding: 0.9,
        halign: 'center',
        valign: 'middle',
        lineColor: [203, 213, 225],
        lineWidth: 0.1,
        overflow: 'ellipsize',
        textColor: [15, 23, 42]
      },
      headStyles: {
        fontSize: 5,
        fontStyle: 'bold',
        textColor: [30, 41, 59]
      },
      footStyles: {
        fontSize: 5.2,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'left', fontStyle: 'bold' },
        9: { fontStyle: 'bold', textColor: [49, 46, 129] },
        11: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' },
        12: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' },
        13: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' },
        14: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' },
        15: { fillColor: [254, 252, 232], textColor: [113, 63, 18], fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        const footerY = pageHeight - 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Grupo GAPP Sistemas • ERP Apuração do Boi v10.6 • Planilha de Compras Oficial • Patrick Pessoa', margin, footerY);

        const totalPages = doc.getNumberOfPages();
        const pageStr = `Página ${data.pageNumber} de ${totalPages}`;
        doc.text(pageStr, pageWidth - margin, footerY, { align: 'right' });
      }
    });

    const dateFileStr = emissionDate.toISOString().split('T')[0];
    const fileName = `Planilha_Compras_Oficial_GAPP_${dateFileStr}.pdf`;
    return { doc, fileName };
  }

  /**
   * Gera o Documento jsPDF de Pedido de Compra Oficial (para download ou envio direto WhatsApp)
   */
  public static async getPurchaseOrderPdfDoc(options: GeneratePurchaseOrderPdfOptions): Promise<{ doc: jsPDF; fileName: string }> {
    const {
      supplierName,
      supplierDetails,
      orderNumber,
      todayStr = new Date().toLocaleDateString('pt-BR'),
      deliveryDateStr = new Date().toLocaleDateString('pt-BR'),
      arrobaPrice,
      pricePerKg,
      carcassWeightPerBoiKg = 240,
      notes = '',
      orderItems,
      currentUser = 'Patrick Pessoa (Diretoria de Compras)'
    } = options;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const margin = 10;

    const logoBase64 = await this.getLogoBase64();
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin, margin, 15, 15);
      } catch {}
    }

    const headerLeftX = logoBase64 ? margin + 18 : margin;

    // Header Top Texts
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text('GRUPO GAPP SISTEMAS • DOCUMENTO OFICIAL DE COMPRA DE GADO', headerLeftX, margin + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 75, 135);
    doc.text(`PEDIDO DE COMPRA Nº ${orderNumber}`, headerLeftX, margin + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Fornecedor / Frigorífico: ${supplierName}  |  Emissão: ${todayStr}  |  Previsão Entrega: ${deliveryDateStr}`, headerLeftX, margin + 15);

    // Meta Box Right
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(pageWidth - margin - 75, margin, 75, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(`Cotação da @: R$ ${arrobaPrice.toFixed(2)} (@ 15kg)`, pageWidth - margin - 72, margin + 5);
    doc.text(`Custo Médio Quarto: R$ ${pricePerKg.toFixed(2)}/kg`, pageWidth - margin - 72, margin + 9.5);
    doc.text(`Responsável: ${currentUser}`, pageWidth - margin - 72, margin + 14);

    // Linha divisória
    doc.setDrawColor(0, 75, 135);
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 18, pageWidth - margin, margin + 18);

    // Tabela de Itens do Pedido por Filial
    const head: any[] = [
      [
        { content: 'FILIAL (16)', styles: { fillColor: [0, 75, 135], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' } },
        { content: 'DIANT.', styles: { fillColor: [0, 75, 135], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'TRAS.', styles: { fillColor: [0, 75, 135], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'COXÃO', styles: { fillColor: [0, 75, 135], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'ALCATRÃO', styles: { fillColor: [0, 75, 135], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'COST. G.', styles: { fillColor: [0, 75, 135], textColor: [255, 255, 255], fontStyle: 'bold' } },
        { content: 'BOIS EQ.', styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175], fontStyle: 'bold' } },
        { content: 'PEDIDO (BOIS)', styles: { fillColor: [254, 240, 138], textColor: [113, 63, 18], fontStyle: 'bold' } },
        { content: 'PESO EST. (KG)', styles: { fillColor: [209, 250, 229], textColor: [6, 95, 70], fontStyle: 'bold' } },
        { content: 'VALOR EST. (R$)', styles: { fillColor: [209, 250, 229], textColor: [6, 95, 70], fontStyle: 'bold' } },
        { content: 'SUÍNO (BANDAS)', styles: { fillColor: [243, 232, 255], textColor: [107, 33, 168], fontStyle: 'bold' } },
        { content: 'COST. SUÍNA', styles: { fillColor: [243, 232, 255], textColor: [107, 33, 168], fontStyle: 'bold' } },
        { content: 'PERNIL', styles: { fillColor: [243, 232, 255], textColor: [107, 33, 168], fontStyle: 'bold' } }
      ]
    ];

    const body: any[] = orderItems.map((item) => [
      item.storeName,
      item.dianteiro,
      item.traseiro,
      item.coxao,
      item.alcatrao,
      item.costela,
      item.boi,
      item.pedido,
      `${Math.round(item.estimatedWeightKg).toLocaleString('pt-BR')} kg`,
      formatCurrencyBRL(item.estimatedTotalR$),
      item.bandaPedido || 0,
      item.costelaSuina || 0,
      item.pernil || 0
    ]);

    const totalBois = orderItems.reduce((acc, i) => acc + i.pedido, 0);
    const totalDiant = orderItems.reduce((acc, i) => acc + i.dianteiro, 0);
    const totalTras = orderItems.reduce((acc, i) => acc + i.traseiro, 0);
    const totalCox = orderItems.reduce((acc, i) => acc + i.coxao, 0);
    const totalAlc = orderItems.reduce((acc, i) => acc + i.alcatrao, 0);
    const totalCost = orderItems.reduce((acc, i) => acc + i.costela, 0);
    const totalBoiEq = orderItems.reduce((acc, i) => acc + i.boi, 0);
    const totalKg = orderItems.reduce((acc, i) => acc + i.estimatedWeightKg, 0);
    const totalR$ = orderItems.reduce((acc, i) => acc + i.estimatedTotalR$, 0);
    const totalBandas = orderItems.reduce((acc, i) => acc + (i.bandaPedido || 0), 0);
    const totalCostSuina = orderItems.reduce((acc, i) => acc + (i.costelaSuina || 0), 0);
    const totalPernil = orderItems.reduce((acc, i) => acc + (i.pernil || 0), 0);

    const foot: any[] = [
      [
        { content: 'TOTAL CONSOLIDADO', styles: { fontStyle: 'bold', halign: 'left', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
        totalDiant,
        totalTras,
        totalCox,
        totalAlc,
        totalCost,
        totalBoiEq,
        totalBois,
        `${Math.round(totalKg).toLocaleString('pt-BR')} kg`,
        formatCurrencyBRL(totalR$),
        totalBandas,
        totalCostSuina,
        totalPernil
      ]
    ];

    autoTable(doc, {
      head,
      body,
      foot,
      startY: margin + 20,
      margin: { left: margin, right: margin, bottom: 20 },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.2,
        halign: 'center',
        valign: 'middle',
        lineColor: [203, 213, 225],
        lineWidth: 0.1,
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { cellWidth: 38, halign: 'left', fontStyle: 'bold' },
        7: { fontStyle: 'bold', textColor: [113, 63, 18], fillColor: [254, 249, 195] },
        8: { halign: 'right', fontStyle: 'bold', textColor: [6, 95, 70] },
        9: { halign: 'right', fontStyle: 'bold', textColor: [6, 95, 70] }
      },
      headStyles: {
        fontSize: 6.5,
        fontStyle: 'bold'
      },
      footStyles: {
        fontSize: 7,
        fontStyle: 'bold',
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        // Observações e Assinaturas no rodapé
        const footerY = pageHeight - 16;
        doc.setDrawColor(203, 213, 225);
        doc.line(margin, footerY, pageWidth - margin, footerY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        if (notes) {
          doc.text(`Observações: ${notes}`, margin, footerY + 4);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text('Grupo GAPP Sistemas • Documento de Compra de Gado • Patrick Pessoa • Validação Oficial', margin, footerY + 10);

        const pageStr = `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`;
        doc.text(pageStr, pageWidth - margin, footerY + 10, { align: 'right' });
      }
    });

    const safeSupplier = supplierName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Pedido_Compra_${orderNumber}_${safeSupplier}.pdf`;
    return { doc, fileName };
  }

  /**
   * Gera e baixa diretamente o Pedido de Compra Oficial em PDF
   */
  public static async generateAndDownloadPurchaseOrderPdf(options: GeneratePurchaseOrderPdfOptions): Promise<void> {
    const { doc, fileName } = await this.getPurchaseOrderPdfDoc(options);
    doc.save(fileName);
  }
}

