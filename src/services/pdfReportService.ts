import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SheetRowData, Store } from '../types/erp';
import { formatCurrencyBRL, formatNumberBR, calculateSheetTotals } from './calculationService';
import { StorageService } from './storageService';

export interface GeneratePdfReportOptions {
  rows: SheetRowData[];
  stores: Store[];
  title?: string;
  emissionDate?: Date;
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
        doc.text('Grupo GAPP Sistemas • ERP Apuração do Boi v10.1 • Portal: www.gipp-site.vercel.app', margin, footerY + 12);

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
}
