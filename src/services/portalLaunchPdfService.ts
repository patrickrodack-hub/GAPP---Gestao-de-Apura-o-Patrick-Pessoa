import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SheetRowData, Store, StockLaunchRecord } from '../types/erp';

export interface GenerateLaunchPdfParams {
  record: StockLaunchRecord;
  store: Store;
  operatorName: string;
  notes?: string;
  emissionDate?: Date;
}

export class PortalLaunchPdfService {
  /**
   * Gera o documento jsPDF do Extrato de Lançamento da Loja (A4 Retrato)
   */
  public static async generateLaunchPdfDoc(params: GenerateLaunchPdfParams): Promise<{
    doc: jsPDF;
    fileName: string;
    blob: Blob;
    file: File;
  }> {
    const { record, store, operatorName, notes = '', emissionDate = new Date() } = params;
    const row = record.rowData;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let currentY = margin;

    // ==========================================
    // 1. CABEÇALHO OFICIAL COM IDENTIDADE GAPP
    // ==========================================
    // Barra superior decorativa
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 24, pageWidth, 1.5, 'F');

    // Título no cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(245, 158, 11); // Amber 500
    doc.text('GRUPO GAPP SISTEMAS • COMPROVANTE OFICIAL DE LANÇAMENTO', margin, 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`EXTRATO DE CONTAGEM DE ESTOQUE • ${store.name.toUpperCase()}`, margin, 17);

    // Meta direita do cabeçalho
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text(`Data: ${record.date}`, pageWidth - margin, 11, { align: 'right' });
    doc.text(`Operador: ${operatorName}`, pageWidth - margin, 16, { align: 'right' });
    doc.text(`ID: ${record.id}`, pageWidth - margin, 21, { align: 'right' });

    currentY = 32;

    // ==========================================
    // 2. QUADRO RESUMO & STATUS "RECEBEU BOI HOJE"
    // ==========================================
    const cardWidth = (pageWidth - margin * 2 - 6) / 3;

    // Card 1: Recebeu Boi Hoje
    const recebeuBoi = record.recebeuBoiHoje;
    doc.setFillColor(recebeuBoi ? 236 : 254, recebeuBoi ? 253 : 242, recebeuBoi ? 245 : 242);
    doc.setDrawColor(recebeuBoi ? 16 : 239, recebeuBoi ? 185 : 68, recebeuBoi ? 129 : 68);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, cardWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(recebeuBoi ? 4 : 153, recebeuBoi ? 120 : 27, recebeuBoi ? 87 : 27);
    doc.text('RECEBEU BOI HOJE:', margin + 3, currentY + 6);
    doc.setFontSize(11);
    doc.text(recebeuBoi ? 'SIM (RECEBEU)' : 'NÃO (SEM ENTREGA)', margin + 3, currentY + 14);

    // Card 2: Total Contado
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin + cardWidth + 3, currentY, cardWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('TOTAL DE PEÇAS & KG:', margin + cardWidth + 6, currentY + 6);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${record.totalPieces} peças (${record.totalKg.toLocaleString('pt-BR')} kg)`, margin + cardWidth + 6, currentY + 14);

    // Card 3: Bois Equivalentes & Sugestão
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin + (cardWidth + 3) * 2, currentY, cardWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text('BOIS EQUIVALENTES:', margin + (cardWidth + 3) * 2 + 3, currentY + 6);
    doc.setFontSize(11);
    doc.text(`${record.boisEquivalente.toFixed(2)} bois (Sug: ${record.sugestaoPedido.toFixed(2)})`, margin + (cardWidth + 3) * 2 + 3, currentY + 14);

    currentY += 23;

    // ==========================================
    // 3. TABELA 1: CÂMARA FRIGORÍFICA (PEÇAS INTEIRAS)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('1. CÂMARA FRIGORÍFICA BOVINA (PEÇAS INTEIRAS & QUARTOS)', margin, currentY);
    currentY += 2.5;

    const camaraRows = [
      [
        'Quarto Dianteiro (Peça ~60kg)',
        `${row.camaraDianteiro} peças`,
        `${(row.camaraDianteiro * 60).toLocaleString('pt-BR')} kg`,
        'Câmara Fria Principal'
      ],
      [
        'Quarto Traseiro Inteiro (Peça ~60kg)',
        `${row.camaraTraseiro} peças`,
        `${(row.camaraTraseiro * 60).toLocaleString('pt-BR')} kg`,
        'Câmara Fria Principal'
      ],
      [
        'Coxão com Osso (Peça ~36kg)',
        `${row.camaraCoxao} peças`,
        `${(row.camaraCoxao * 36).toLocaleString('pt-BR')} kg`,
        'Divisão Traseiro com Osso'
      ],
      [
        'Alcatrão com Osso (Peça ~24kg)',
        `${row.camaraAlcatrao} peças`,
        `${(row.camaraAlcatrao * 24).toLocaleString('pt-BR')} kg`,
        'Divisão Traseiro com Osso'
      ],
      [
        'Soma Traseiro Consolidado (Traseiro + Coxão + Alcatrão)',
        `${row.somaDoTraseiro.toFixed(1)} peças`,
        `${(row.somaDoTraseiro * 60).toLocaleString('pt-BR')} kg`,
        'Cálculo Oficial Matriz'
      ],
      [
        'Costela Gaúcha (Peça ~20kg)',
        `${row.camaraCostelaGaucha} peças`,
        `${(row.camaraCostelaGaucha * 20).toLocaleString('pt-BR')} kg`,
        'Câmara Fria'
      ],
      [
        'Peças em Trânsito / Aguardando Descarga',
        `${row.pTransito || 0} peças`,
        '—',
        'Controle Logístico'
      ]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['ITEM DA CÂMARA', 'QUANTIDADE', 'PESO ESTIMADO', 'DESTINAÇÃO']],
      body: camaraRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 35, halign: 'center' },
        3: { halign: 'left' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // ==========================================
    // 4. TABELA 2: DESOSSA & BALCÃO BOVINO
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('2. DESOSSA & BALCÃO BOVINO (CORTES FRACIONADOS)', margin, currentY);
    currentY += 2.5;

    const desossaRows = [
      // Nobres
      ['[NOBRES] Alcatra', `${row.alcatra} peças`, `${(row.alcatraKg || 0).toFixed(1)} kg`, '[NOBRES] Contra Filé', `${row.contraFile} peças`, `${(row.contraFileKg || 0).toFixed(1)} kg`],
      ['[NOBRES] Picanha', `${row.picanha} peças`, `${(row.picanhaKg || 0).toFixed(1)} kg`, '[NOBRES] Filé Mignon', `${row.fileMignon} peças`, `${(row.fileMignonKg || 0).toFixed(1)} kg`],
      ['[NOBRES] Costela Congelada', `${row.costelaCong} peças`, '—', '—', '—', '—'],
      // Dianteiro
      ['[DIANT] Paleta', `${row.paletaPecas} peças`, `${row.paletaKg.toFixed(1)} kg`, '[DIANT] Acém', `${row.acemPecas} peças`, `${row.acemKg.toFixed(1)} kg`],
      ['[DIANT] Peito Bovino', `${row.peitoPecas} peças`, `${row.peitoKg.toFixed(1)} kg`, '[DIANT] Músculo', `${row.musculoPecas} peças`, `${row.musculoKg.toFixed(1)} kg`],
      // Traseiro
      ['[TRAS] Chã de Dentro', `${row.chaPecas} peças`, `${row.chaKg.toFixed(1)} kg`, '[TRAS] Patinho', `${row.patinhoPecas} peças`, `${row.patinhoKg.toFixed(1)} kg`],
      ['[TRAS] Lagarto Redondo', `${row.lagartoRedondoPecas} peças`, `${row.lagartoRedondoKg.toFixed(1)} kg`, '[TRAS] Lagarto Plano', `${row.lagartoPlanoPecas} peças`, `${row.lagartoPlanoKg.toFixed(1)} kg`]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['CORTE (GRUPO A)', 'PEÇAS', 'QUILOS', 'CORTE (GRUPO B)', 'PEÇAS', 'QUILOS']],
      body: desossaRows,
      theme: 'grid',
      headStyles: {
        fillColor: [6, 95, 70], // Emerald 800
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 1.4,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 44, fontStyle: 'bold' },
        1: { cellWidth: 24, halign: 'center' },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: 44, fontStyle: 'bold' },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 26, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // ==========================================
    // 5. TABELA 3: ESTOQUE SUÍNO (CÂMARA / BALCÃO)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('3. ESTOQUE SUÍNO (CÂMARA & BALCÃO)', margin, currentY);
    currentY += 2.5;

    const suinoRows = [
      ['Banda Suína Inteira (Câmara/Balcão)', `${row.bandaPecas || 0} peças / bandas`, `${(row.bandaKg || 0).toFixed(1)} kg`, 'Estoque de Banda'],
      ['Costela Suína Fracionada', `${row.costelaSuinaPecas || 0} peças`, '—', 'Balcão / Bandeja'],
      ['Pernil Suíno', `${row.pernilPecas || 0} peças`, '—', 'Balcão / Exposição']
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['ITEM SUÍNO', 'QUANTIDADE', 'PESO ESTIMADO', 'OBSERVAÇÃO']],
      body: suinoRows,
      theme: 'grid',
      headStyles: {
        fillColor: [180, 83, 9], // Amber 700
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 1.4,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 35, halign: 'center' },
        3: { halign: 'left' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // ==========================================
    // 6. OBSERVAÇÕES & NOTAS DO ENCARREGADO
    // ==========================================
    if (notes && notes.trim().length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('OBSERVAÇÕES DO ENCARREGADO:', margin, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const splitNotes = doc.splitTextToSize(notes.trim(), pageWidth - margin * 2);
      doc.text(splitNotes, margin, currentY);
      currentY += splitNotes.length * 3.5 + 4;
    }

    // ==========================================
    // 7. ASSINATURAS & AUTENTICAÇÃO DIGITAL
    // ==========================================
    const footerStartY = Math.max(currentY, pageHeight - 34);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, footerStartY + 14, margin + 80, footerStartY + 14);
    doc.line(pageWidth - margin - 80, footerStartY + 14, pageWidth - margin, footerStartY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(operatorName, margin + 40, footerStartY + 18, { align: 'center' });
    doc.text('Direção de Carnes / Matriz GAPP', pageWidth - margin - 40, footerStartY + 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Encarregado • ${store.name}`, margin + 40, footerStartY + 21, { align: 'center' });
    doc.text('Auditoria & Recebimento Oficial', pageWidth - margin - 40, footerStartY + 21, { align: 'center' });

    // Rodapé de segurança
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`Grupo GAPP Sistemas • ERP Apuração do Boi v10.6 • Extrato Digital Autenticado: ${record.id} • Portal: https://gipp-site.vercel.app/`, margin, pageHeight - 5);

    // Gera arquivo e blob
    const dateFileStr = emissionDate.toISOString().slice(0, 10);
    const storeSafeName = store.code || store.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Extrato_Lancamento_${storeSafeName}_${dateFileStr}.pdf`;

    const blob = doc.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    return { doc, fileName, blob, file };
  }

  /**
   * Dispara o download direto do Extrato em PDF no navegador do cliente
   */
  public static async downloadLaunchPdf(params: GenerateLaunchPdfParams): Promise<void> {
    const { doc, fileName } = await this.generateLaunchPdfDoc(params);
    doc.save(fileName);
  }

  /**
   * Compartilha o Extrato de Lançamento em PDF e resumo formatado via WhatsApp
   */
  public static async shareLaunchViaWhatsApp(params: {
    record: StockLaunchRecord;
    store: Store;
    operatorName: string;
    notes?: string;
    targetPhone?: string;
  }): Promise<{ success: boolean; sharedViaWebShare: boolean; pdfDownloaded: boolean }> {
    const { record, store, operatorName, notes = '', targetPhone = '' } = params;
    const row = record.rowData;

    // 1. Gera o PDF em memória
    const { doc, fileName, file } = await this.generateLaunchPdfDoc({
      record,
      store,
      operatorName,
      notes
    });

    // 2. Monta texto estruturado completo para o WhatsApp
    const messageLines = [
      `🥩 *GRUPO GAPP SISTEMAS • EXTRATO DE LANÇAMENTO*`,
      `📅 *Data/Hora:* ${record.date}`,
      `🏪 *Filial:* ${store.name} (${store.code})`,
      `👤 *Encarregado:* ${operatorName}`,
      ``,
      `🐂 *RESUMO GERAL:*`,
      `• *Recebeu Boi Hoje:* ${record.recebeuBoiHoje ? '✅ SIM (RECEBEU)' : '❌ NÃO (SEM ENTREGA)'}`,
      `• *Bois Equivalente:* ${record.boisEquivalente.toFixed(2)} bois`,
      `• *Sugestão de Pedido:* ${record.sugestaoPedido.toFixed(2)} bois`,
      `• *Total de Peças Contadas:* ${record.totalPieces} peças`,
      `• *Peso Estimado:* ${record.totalKg.toLocaleString('pt-BR')} kg`,
      ``,
      `🧊 *CÂMARA FRIGORÍFICA (PEÇAS INTEIRAS):*`,
      `• Dianteiro: ${row.camaraDianteiro} pçs (${row.camaraDianteiro * 60} kg)`,
      `• Traseiro: ${row.camaraTraseiro} pçs (${row.camaraTraseiro * 60} kg)`,
      `• Coxão c/ Osso: ${row.camaraCoxao} pçs (${row.camaraCoxao * 36} kg)`,
      `• Alcatrão c/ Osso: ${row.camaraAlcatrao} pçs (${row.camaraAlcatrao * 24} kg)`,
      `• Soma Traseiro: ${row.somaDoTraseiro.toFixed(1)} pçs (${(row.somaDoTraseiro * 60).toFixed(0)} kg)`,
      `• Costela Gaúcha: ${row.camaraCostelaGaucha} pçs (${row.camaraCostelaGaucha * 20} kg)`,
      row.pTransito ? `• Em Trânsito: ${row.pTransito} pçs` : '',
      ``,
      `🔪 *DESOSSA & BALCÃO (CORTES NOBRES & PRINCIPAIS):*`,
      `• Alcatra: ${row.alcatra} pçs (${(row.alcatraKg || 0).toFixed(1)} kg)`,
      `• Contra Filé: ${row.contraFile} pçs (${(row.contraFileKg || 0).toFixed(1)} kg)`,
      `• Picanha: ${row.picanha} pçs (${(row.picanhaKg || 0).toFixed(1)} kg)`,
      `• Filé Mignon: ${row.fileMignon} pçs (${(row.fileMignonKg || 0).toFixed(1)} kg)`,
      `• Paleta: ${row.paletaPecas} pçs (${row.paletaKg.toFixed(1)} kg)`,
      `• Acém: ${row.acemPecas} pçs (${row.acemKg.toFixed(1)} kg)`,
      `• Chã de Dentro: ${row.chaPecas} pçs (${row.chaKg.toFixed(1)} kg)`,
      `• Patinho: ${row.patinhoPecas} pçs (${row.patinhoKg.toFixed(1)} kg)`,
      ``,
      `🐖 *ESTOQUE SUÍNO:*`,
      `• Banda Suína: ${row.bandaPecas || 0} pçs (${(row.bandaKg || 0).toFixed(1)} kg)`,
      row.costelaSuinaPecas ? `• Costela Suína: ${row.costelaSuinaPecas} pçs` : '',
      row.pernilPecas ? `• Pernil Suíno: ${row.pernilPecas} pçs` : '',
      ``,
      notes.trim() ? `📝 *Observações:* ${notes.trim()}\n` : '',
      `📄 _O Extrato Oficial em PDF foi gerado pelo sistema com todos os detalhes._`,
      `🌐 _Portal Oficial:_ https://gipp-site.vercel.app/`,
      `🔒 _Autenticação Grupo GAPP • v10.6_`
    ].filter(Boolean);

    const messageText = messageLines.join('\n');
    let sharedViaWebShare = false;

    // 3. Tenta compartilhamento nativo com o arquivo PDF anexado via Web Share API
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Extrato de Lançamento - ${store.name}`,
          text: messageText,
        });
        sharedViaWebShare = true;
        return { success: true, sharedViaWebShare: true, pdfDownloaded: false };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return { success: false, sharedViaWebShare: false, pdfDownloaded: false };
        }
        console.warn('Web Share API falhou, usando redirecionamento WhatsApp:', err);
      }
    }

    // 4. Fallback: Dispara o download automático do PDF e abre o WhatsApp com a mensagem estruturada
    doc.save(fileName);

    const sanitizedPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const phoneParam = sanitizedPhone ? `phone=${sanitizedPhone}&` : '';
    const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(messageText)}`;

    const win = window.open(whatsappUrl, '_blank');
    if (!win) {
      window.location.href = whatsappUrl;
    }

    return { success: true, sharedViaWebShare: false, pdfDownloaded: true };
  }
}
