import { SheetRowData, Store, Supplier } from '../types/erp';
import { calculateSheetTotals, formatCurrencyBRL } from './calculationService';
import { PdfReportService, GeneratePurchaseOrderPdfOptions } from './pdfReportService';

export class WhatsAppShareService {
  /**
   * Sanitiza e formata um número de telefone para o padrão internacional do WhatsApp (55DDDNÚMERO)
   */
  public static sanitizePhone(phone?: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    // Se já tiver 55 no início (ex: 5521999999999)
    if (digits.startsWith('55') && digits.length >= 12) {
      return digits;
    }
    // Se tiver DDD + 8 ou 9 dígitos (ex: 21999999999 ou 2188888888)
    if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    return digits;
  }

  /**
   * 1. Compartilha a PLANILHA OFICIAL DE COMPRAS EM PDF via WhatsApp
   */
  public static async shareSpreadsheetPdfViaWhatsApp(params: {
    rows: SheetRowData[];
    stores: Store[];
    title?: string;
    emissionDate?: Date;
    currentUser?: string;
    targetPhone?: string;
  }): Promise<{ success: boolean; sharedViaWebShare: boolean }> {
    const {
      rows,
      stores,
      title = 'Planilha Oficial de Compras da Direção',
      emissionDate = new Date(),
      currentUser = 'Patrick Pessoa (Direção de Carnes)',
      targetPhone = ''
    } = params;

    const totals = calculateSheetTotals(rows);
    const dateFormatted = emissionDate.toLocaleDateString('pt-BR');
    const timeFormatted = emissionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Gera o documento PDF real em memória
    const { doc, fileName } = await PdfReportService.getFullSpreadsheetPdfDoc({
      rows,
      stores,
      title: title.toUpperCase(),
      emissionDate,
      currentUser
    });

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // 2. Monta a mensagem de WhatsApp formatada
    const totalPecasBovino = totals.pedidoDianteiro + totals.pedidoTraseiro + totals.pedidoCoxao + totals.pedidoAlcatrao + totals.pedidoCostelaGaucha;
    const totalKgEst = Math.round(totals.boi * 240);
    const totalBandas = totals.bandaPedido || 0;

    const messageLines = [
      `📊 *GRUPO GAPP SISTEMAS • PLANILHA OFICIAL DE COMPRAS*`,
      `📅 *Emissão:* ${dateFormatted} às ${timeFormatted}`,
      `👤 *Responsável:* ${currentUser}`,
      `🏪 *Rede:* 16 Filiais Consolidadas`,
      ``,
      `🐂 *RESUMO CONSOLIDADO DE COMPRA (BOVINO):*`,
      `• *Total de Bois Equivalente:* ${totals.boi.toFixed(1)} cabeças`,
      `• *Quarto Dianteiro:* ${totals.pedidoDianteiro} peças (${totals.pedidoDianteiro * 60} kg)`,
      `• *Quarto Traseiro:* ${totals.pedidoTraseiro} peças (${totals.pedidoTraseiro * 60} kg)`,
      `• *Coxão com Osso:* ${totals.pedidoCoxao} peças (${totals.pedidoCoxao * 36} kg)`,
      `• *Alcatrão com Osso:* ${totals.pedidoAlcatrao} peças (${totals.pedidoAlcatrao * 24} kg)`,
      `• *Costela Gaúcha:* ${totals.pedidoCostelaGaucha} peças (${totals.pedidoCostelaGaucha * 20} kg)`,
      `• *Total de Peças Bovinas:* ${totalPecasBovino} peças`,
      `• *Volume Estimado:* ${totalKgEst.toLocaleString('pt-BR')} kg`,
      `• *Custo Estimado Base (@ R$ 390,00):* R$ 376.311,95`,
      ``,
      totalBandas > 0 ? `🐖 *SUÍNO (CÂMARA / BALCÃO):* ${totalBandas} bandas (${(totalBandas * 36).toLocaleString('pt-BR')} kg)\n` : '',
      `📄 _O arquivo PDF completo em formato A4 Paisagem foi gerado para anexo._`,
      `🔒 _Autenticação Oficial Grupo GAPP • v10.7_`
    ].filter(Boolean);

    const messageText = messageLines.join('\n');
    let sharedViaWebShare = false;

    // 3. Tenta compartilhamento nativo com o arquivo PDF anexado via Web Share API
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Planilha Oficial de Compras - ${dateFormatted}`,
          text: messageText,
        });
        sharedViaWebShare = true;
        return { success: true, sharedViaWebShare: true };
      } catch (err: any) {
        // Se o usuário cancelou o share nativo, não abre link extra
        if (err?.name === 'AbortError') {
          return { success: true, sharedViaWebShare: true };
        }
        console.warn('Web Share falhou ou cancelado, acionando fallback WhatsApp Web:', err);
      }
    }

    // 4. Fallback: Baixa o PDF no dispositivo e abre o WhatsApp com o texto pré-preenchido
    doc.save(fileName);

    const sanitizedPhone = this.sanitizePhone(targetPhone);
    const phoneParam = sanitizedPhone ? `phone=${sanitizedPhone}&` : '';
    const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(messageText)}`;

    window.open(whatsappUrl, '_blank');
    return { success: true, sharedViaWebShare: false };
  }

  /**
   * 2. Compartilha o PEDIDO DE COMPRA EM PDF via WhatsApp (para o Frigorífico / Fornecedor)
   */
  public static async sharePurchaseOrderPdfViaWhatsApp(params: GeneratePurchaseOrderPdfOptions & {
    targetPhone?: string;
  }): Promise<{ success: boolean; sharedViaWebShare: boolean }> {
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
      currentUser = 'Patrick Pessoa (Diretoria de Compras)',
      targetPhone
    } = params;

    // 1. Gera o documento PDF real do Pedido de Compra
    const { doc, fileName } = await PdfReportService.getPurchaseOrderPdfDoc({
      supplierName,
      supplierDetails,
      orderNumber,
      todayStr,
      deliveryDateStr,
      arrobaPrice,
      pricePerKg,
      carcassWeightPerBoiKg,
      notes,
      orderItems,
      currentUser
    });

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // 2. Calcula os totais do pedido
    const totalBois = orderItems.reduce((acc, i) => acc + i.pedido, 0);
    const totalDiant = orderItems.reduce((acc, i) => acc + i.dianteiro, 0);
    const totalTras = orderItems.reduce((acc, i) => acc + i.traseiro, 0);
    const totalCox = orderItems.reduce((acc, i) => acc + i.coxao, 0);
    const totalAlc = orderItems.reduce((acc, i) => acc + i.alcatrao, 0);
    const totalCost = orderItems.reduce((acc, i) => acc + i.costela, 0);
    const totalBandas = orderItems.reduce((acc, i) => acc + (i.bandaPedido || 0), 0);
    const totalKg = orderItems.reduce((acc, i) => acc + i.estimatedWeightKg, 0);
    const totalR$ = orderItems.reduce((acc, i) => acc + i.estimatedTotalR$, 0);

    // 3. Monta a mensagem de WhatsApp formatada para o frigorífico
    const messageLines = [
      `📑 *GRUPO GAPP SISTEMAS • PEDIDO DE COMPRA Nº ${orderNumber}*`,
      `🏢 *Fornecedor / Frigorífico:* ${supplierName}`,
      `📅 *Data de Emissão:* ${todayStr}`,
      `🚚 *Previsão de Entrega:* ${deliveryDateStr}`,
      `👤 *Responsável:* ${currentUser}`,
      ``,
      `🐂 *ESPECIFICAÇÕES DO LOTE MATRIZ:*`,
      `• *Cotação da Arroba:* R$ ${arrobaPrice.toFixed(2)} (@ 15kg)`,
      `• *Custo Médio/kg:* R$ ${pricePerKg.toFixed(2)}/kg`,
      `• *Peso Médio da Carcaça:* ${carcassWeightPerBoiKg} kg/boi`,
      ``,
      `📦 *QUANTIDADES PEDIDAS (CONSOLIDADO 16 FILIAIS):*`,
      `• *Total de Bois Pedidos:* ${totalBois} cabeças`,
      `• *Dianteiro:* ${totalDiant} peças`,
      `• *Traseiro:* ${totalTras} peças`,
      `• *Coxão:* ${totalCox} peças`,
      `• *Alcatrão:* ${totalAlc} peças`,
      `• *Costela Gaúcha:* ${totalCost} peças`,
      totalBandas > 0 ? `• *Suíno (Bandas):* ${totalBandas} peças` : '',
      `• *Peso Total Estimado:* ${Math.round(totalKg).toLocaleString('pt-BR')} kg`,
      `• *Valor Total do Pedido:* ${formatCurrencyBRL(totalR$)}`,
      ``,
      notes ? `📝 *Observações:* ${notes}\n` : '',
      `📎 _O documento oficial do pedido (PDF) está em anexo._`,
      `✅ _Favor confirmar o recebimento e programação de carregamento._`
    ].filter(Boolean);

    const messageText = messageLines.join('\n');
    let sharedViaWebShare = false;

    // 4. Tenta compartilhamento nativo com arquivo PDF via Web Share API
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: `Pedido de Compra ${orderNumber} - ${supplierName}`,
          text: messageText,
        });
        sharedViaWebShare = true;
        return { success: true, sharedViaWebShare: true };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: true, sharedViaWebShare: true };
        }
        console.warn('Web Share falhou ou cancelado, acionando fallback WhatsApp Web:', err);
      }
    }

    // 5. Fallback: Baixa o PDF no dispositivo e abre o WhatsApp com o telefone do frigorífico pré-preenchido
    doc.save(fileName);

    const targetPhoneNumber = targetPhone || supplierDetails?.phone || '';
    const sanitizedPhone = this.sanitizePhone(targetPhoneNumber);
    const phoneParam = sanitizedPhone ? `phone=${sanitizedPhone}&` : '';
    const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(messageText)}`;

    window.open(whatsappUrl, '_blank');
    return { success: true, sharedViaWebShare: false };
  }
}
