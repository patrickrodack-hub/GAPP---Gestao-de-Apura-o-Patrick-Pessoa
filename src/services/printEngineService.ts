import { SheetRowData, Store, Supplier, PurchaseBatch } from '../types/erp';
import { formatCurrencyBRL, formatNumberBR } from './calculationService';

export interface PrintEngineOptions {
  documentTitle: string;
  landscape?: boolean;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Motor de Impressão Profissional GIPP
 * Utiliza iframe isolado em alta resolução com estilização CSS nativa para impressão,
 * sem cortes de margem, sem distorção e com quebras de página controladas para A4.
 */
export class PrintEngineService {
  /**
   * Executa a impressão isolada via iframe seguro
   */
  public static printDocument(htmlContent: string, options: PrintEngineOptions): void {
    if (options.onBeforePrint) options.onBeforePrint();

    // Remove qualquer iframe de impressão anterior existente
    const oldIframe = document.getElementById('gipp-print-engine-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'gipp-print-engine-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      // Fallback para window.print se iframe não estiver acessível
      window.print();
      return;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Aguarda o carregamento dos estilos e renderização do iframe
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Erro ao acionar motor de impressão GIPP:', e);
          window.print();
        } finally {
          if (options.onAfterPrint) options.onAfterPrint();
          setTimeout(() => {
            iframe.remove();
          }, 2000);
        }
      }, 300);
    };
  }

  /**
   * Gera o layout oficial GIPP para Pedido de Compra Padrão
   */
  public static generatePurchaseOrderHtml(params: {
    supplierName: string;
    supplierDetails?: Supplier;
    orderNumber: string;
    todayStr: string;
    deliveryDateStr: string;
    arrobaPrice: number;
    pricePerKg: number;
    carcassWeightPerBoiKg: number;
    notes: string;
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
  }): string {
    const {
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
    } = params;

    // Bovino totals
    const totalBoisPedidos = orderItems.reduce((acc, i) => acc + i.pedido, 0);
    const totalDianteiro = orderItems.reduce((acc, i) => acc + i.dianteiro, 0);
    const totalTraseiro = orderItems.reduce((acc, i) => acc + i.traseiro, 0);
    const totalCoxao = orderItems.reduce((acc, i) => acc + i.coxao, 0);
    const totalAlcatrao = orderItems.reduce((acc, i) => acc + i.alcatrao, 0);
    const totalCostela = orderItems.reduce((acc, i) => acc + i.costela, 0);
    const totalBoiEquivalente = orderItems.reduce((acc, i) => acc + i.boi, 0);
    const totalVenda = orderItems.reduce((acc, i) => acc + i.venda, 0);
    const totalSugestao = orderItems.reduce((acc, i) => acc + i.sugestao, 0);
    const totalWeightKg = orderItems.reduce((acc, i) => acc + i.estimatedWeightKg, 0);
    const totalCostR$ = orderItems.reduce((acc, i) => acc + i.estimatedTotalR$, 0);

    // Suíno totals
    const totalBandaPecas = orderItems.reduce((acc, i) => acc + (i.bandaPecas || 0), 0);
    const totalBandaVenda = orderItems.reduce((acc, i) => acc + (i.bandaVenda || 0), 0);
    const totalBandaSugestao = orderItems.reduce((acc, i) => acc + (i.bandaSugestao || 0), 0);
    const totalBandasPedidas = orderItems.reduce((acc, i) => acc + (i.bandaPedido || 0), 0);
    const totalCostelaSuina = orderItems.reduce((acc, i) => acc + (i.costelaSuina || 0), 0);
    const totalPernil = orderItems.reduce((acc, i) => acc + (i.pernil || 0), 0);

    const hashAuth = `GIPP-SEC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Pedido de Compra - ${orderNumber} - ${supplierName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 8pt;
      line-height: 1.2;
      color: #0f172a;
      background: #ffffff;
      padding: 2mm;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #004b87;
      margin-bottom: 5px;
      padding-bottom: 4px;
    }
    .company-title {
      font-size: 14pt;
      font-weight: 900;
      color: #004b87;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 7pt;
      font-weight: bold;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .badge-primary {
      background: #004b87;
      color: #ffffff;
    }
    .badge-amber {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 4px;
      margin-bottom: 6px;
    }
    .card-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      border-radius: 4px;
    }
    .card-label {
      font-size: 6.5pt;
      text-transform: uppercase;
      color: #64748b;
      font-weight: bold;
      display: block;
    }
    .card-value {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      font-family: "Courier New", Courier, monospace;
    }
    .card-value.highlight {
      color: #004b87;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 7.2pt;
    }
    .data-table th, .data-table td {
      border: 1px solid #cbd5e1;
      padding: 2.5px 3.5px;
      text-align: center;
    }
    .data-table th {
      background: #e2e8f0;
      color: #1e293b;
      font-weight: 800;
      font-size: 6.8pt;
      text-transform: uppercase;
    }
    .data-table th.bg-bovino {
      background: #dbeafe;
      color: #1e40af;
      border-bottom: 1.5px solid #1e40af;
    }
    .data-table th.bg-suino {
      background: #ccfbf1;
      color: #115e59;
      border-bottom: 1.5px solid #115e59;
    }
    .data-table th.bg-financeiro {
      background: #dcfce7;
      color: #166534;
      border-bottom: 1.5px solid #166534;
    }
    .data-table td.store-name {
      text-align: left;
      font-weight: 700;
      background: #f8fafc;
      white-space: nowrap;
    }
    .data-table tr.total-row {
      background: #f1f5f9;
      font-weight: 900;
      border-top: 2px solid #0f172a;
    }
    .data-table tr.total-row td {
      background: #e2e8f0;
      color: #0f172a;
    }
    .font-mono {
      font-family: "Courier New", Courier, monospace;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 6px;
      margin-top: 4px;
      page-break-inside: avoid;
    }
    .signatures-box {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
      page-break-inside: avoid;
    }
    .sig-line {
      border-top: 1px dashed #64748b;
      padding-top: 3px;
      text-align: center;
      font-size: 6.5pt;
      color: #475569;
    }
    .sec-hash {
      font-family: monospace;
      font-size: 6pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <!-- Header GIPP -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <span class="badge badge-primary">Motor de Impressão GIPP</span>
        <span class="badge badge-amber" style="margin-left: 4px;">Documento Oficial de Fornecimento</span>
        <div class="company-title">ERP APURAÇÃO DO BOI • PEDIDO DE COMPRA</div>
        <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
          <strong>Grupo GAPP Sistemas</strong> • Por Patrick Pessoa • Matriz Operacional 16 Lojas
        </div>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <div style="font-size: 7pt; color: #64748b;">NÚMERO DO PEDIDO</div>
        <div style="font-size: 13pt; font-weight: 900; color: #004b87; font-family: monospace;">${orderNumber}</div>
        <div style="font-size: 6.8pt; color: #475569;">Emissão: <strong>${todayStr}</strong> | Entrega: <strong style="color: #b45309;">${deliveryDateStr}</strong></div>
      </td>
    </tr>
  </table>

  <!-- Fornecedor & Condições -->
  <div class="card-grid">
    <div class="card-box" style="grid-column: span 2;">
      <span class="card-label">Frigorífico / Fornecedor</span>
      <span class="card-value highlight" style="font-size: 8.5pt;">${supplierName}</span>
      <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">
        ${supplierDetails?.cnpj ? `CNPJ: ${supplierDetails.cnpj}` : ''} 
        ${supplierDetails?.sifNumber ? `• ${supplierDetails.sifNumber}` : ''}
        ${supplierDetails?.phone ? `• Tel: ${supplierDetails.phone}` : ''}
      </div>
    </div>
    <div class="card-box">
      <span class="card-label">Preço da Arroba (@)</span>
      <span class="card-value">${formatCurrencyBRL(arrobaPrice)}</span>
    </div>
    <div class="card-box">
      <span class="card-label">Custo Base / Kg</span>
      <span class="card-value">${formatCurrencyBRL(pricePerKg)}/kg</span>
    </div>
    <div class="card-box">
      <span class="card-label">Total Bois Pedidos</span>
      <span class="card-value highlight" style="color: #1e40af;">${totalBoisPedidos} bois</span>
    </div>
    <div class="card-box">
      <span class="card-label">Valor Total Previsto</span>
      <span class="card-value highlight" style="color: #166534;">${formatCurrencyBRL(totalCostR$)}</span>
    </div>
  </div>

  <!-- Tabela Oficial de Distribuição das Lojas (5 Colunas Padrão) -->
  <div style="margin-bottom: 6px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
    <div style="background: #f1f5f9; padding: 4px 8px; font-weight: 800; font-size: 7.5pt; text-transform: uppercase; color: #1e293b; display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1;">
      <span>AJUSTAR QUANTIDADES PEDIDAS POR FILIAL</span>
      <span style="color: #64748b;">${orderItems.length} LOJAS</span>
    </div>
    <table class="data-table" style="margin-bottom: 0;">
      <thead>
        <tr>
          <th style="width: 28%; text-align: left; padding: 4px 6px;">LOJA</th>
          <th style="width: 18%; background: #e0e7ff; color: #312e81; font-weight: 800;">BOI (QTD PEDIDA)</th>
          <th style="width: 18%; background: #ccfbf1; color: #115e59; font-weight: 800;">SUÍNO / BANDA (QTD)</th>
          <th style="width: 18%; text-align: right; padding-right: 6px;">PESO ESTIMADO (KG)</th>
          <th style="width: 18%; text-align: right; padding-right: 6px; background: #dcfce7; color: #14532d;">VALOR ESTIMADO (R$)</th>
        </tr>
      </thead>
      <tbody class="font-mono">
        ${orderItems.map((item, idx) => `
          <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td class="store-name" style="padding: 3.5px 6px; font-size: 7.8pt;">${item.storeName}</td>
            <td style="background: #eef2ff; font-weight: 900; color: #1e40af; font-size: 8.5pt;">${item.pedido}</td>
            <td style="background: #f0fdfa; font-weight: 900; color: #0f766e; font-size: 8.5pt;">${item.bandaPedido || 0}</td>
            <td style="text-align: right; padding-right: 6px; font-weight: 700; color: #334155;">${formatNumberBR(item.estimatedWeightKg, 0)} kg</td>
            <td style="text-align: right; padding-right: 6px; font-weight: 900; color: #15803d;">${formatCurrencyBRL(item.estimatedTotalR$)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr class="total-row font-mono">
          <td style="text-align: left; font-family: sans-serif; font-size: 8pt; font-weight: 900; padding: 4px 6px;">TOTAL GERAL (${orderItems.length} LOJAS)</td>
          <td style="background: #c7d2fe; color: #1e1b4b; font-size: 9pt; font-weight: 900;">${totalBoisPedidos}</td>
          <td style="background: #99f6e4; color: #042f2e; font-size: 9pt; font-weight: 900;">${totalBandasPedidas}</td>
          <td style="text-align: right; padding-right: 6px; font-size: 8.5pt; font-weight: 900; color: #0f172a;">${formatNumberBR(totalWeightKg, 0)} kg</td>
          <td style="text-align: right; padding-right: 6px; font-size: 9pt; font-weight: 900; color: #14532d; background: #bbf7d0;">${formatCurrencyBRL(totalCostR$)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Informações de Entrega e Assinaturas -->
  <div class="footer-grid">
    <div style="font-size: 6.8pt; color: #475569; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 6px; border-radius: 4px;">
      <strong>Observações / Instruções de Transporte:</strong> ${notes || 'Entrega com caminhão frigorificado com termômetro calibrado (0°C a 4°C). Guia de Trânsito Animal (GTA) e Certificado SIF obrigatórios no descarregamento.'}
    </div>
    <div style="font-size: 6.8pt; color: #475569; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 6px; border-radius: 4px;">
      <strong>Condições Comerciais:</strong> ${supplierDetails?.paymentTerms || '7 / 14 / 21 dias'} • <strong>Base Carcaça:</strong> ${carcassWeightPerBoiKg}kg
    </div>
    <div style="font-size: 6.5pt; color: #64748b; text-align: right; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 6px; border-radius: 4px;">
      <div>Autenticação Digital GIPP:</div>
      <div class="sec-hash">${hashAuth}</div>
    </div>
  </div>

  <div class="signatures-box">
    <div class="sig-line">
      <strong>Direção de Compras / GIPP ERP</strong><br>
      Patrick Pessoa • Comprador Autorizado
    </div>
    <div class="sig-line">
      <strong>Conferência de Recebimento / Logística</strong><br>
      Encarregado de Câmara / Descarregamento
    </div>
    <div class="sig-line">
      <strong>Frigorífico Fornecedor / Motorista</strong><br>
      Nome Legível e RG / Assinatura
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Gera o layout oficial GIPP para Apuração do Boi / Matriz da Planilha
   */
  public static generateSheetReportHtml(params: {
    rows: SheetRowData[];
    stores: Store[];
    yieldBasis: 'carcass' | 'piece';
    title?: string;
  }): string {
    const { rows, yieldBasis, title } = params;

    const totalPedDianteiro = rows.reduce((a, b) => a + (b.pedidoDianteiro || 0), 0);
    const totalPedTraseiro = rows.reduce((a, b) => a + (b.pedidoTraseiro || 0), 0);
    const totalPedCoxao = rows.reduce((a, b) => a + (b.pedidoCoxao || 0), 0);
    const totalPedAlcatrao = rows.reduce((a, b) => a + (b.pedidoAlcatrao || 0), 0);
    const totalVenda = rows.reduce((a, b) => a + (b.venda || b.boiAVenda || 0), 0);
    const totalBoi = rows.reduce((a, b) => a + (b.boi || 0), 0);
    const totalSugestao = rows.reduce((a, b) => a + (b.sugestaoPedido || 0), 0);
    const totalCamara = rows.reduce((a, b) => a + (b.camaraDianteiro + b.somaDoTraseiro + b.camaraCostelaGaucha), 0);

    const now = new Date();
    const emissionDateFormatted = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const emissionTimeFormatted = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const hashAuth = `GAPP-MATRIZ-${Date.now().toString(36).toUpperCase()}`;

    const totalPecas = totalPedDianteiro + totalPedTraseiro + totalPedCoxao + totalPedAlcatrao;
    const estimatedWeight = totalBoi * 240;
    const estimatedTotal = estimatedWeight * 26.0;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title || 'Relatório Gerencial de Apuração do Boi'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 8pt;
      color: #0f172a;
      background: #ffffff;
      padding: 2mm;
    }
    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #004b87;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
    }
    .title {
      font-size: 13pt;
      font-weight: 900;
      color: #004b87;
      letter-spacing: -0.3px;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 8px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 4px 6px;
    }
    .kpi-label {
      font-size: 6.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 9.5pt;
      font-weight: 900;
      font-family: monospace;
      color: #0f172a;
    }
    .table-data {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-bottom: 8px;
    }
    .table-data th, .table-data td {
      border: 1px solid #cbd5e1;
      padding: 3.5px 5px;
      text-align: center;
    }
    .table-data th {
      background: #004b87;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 6.8pt;
    }
    .total-row {
      background: #e2e8f0;
      font-weight: 900;
    }
    .total-row td {
      background: #e2e8f0;
      color: #0f172a;
      font-weight: 900;
    }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 6.8pt;
      color: #475569;
    }
    .sig-line {
      border-top: 1px dashed #64748b;
      margin-top: 20px;
      padding-top: 3px;
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="brand-section">
      <img src="/brand-logo.svg" alt="Grupo GAPP" class="brand-logo" onerror="this.src='/patrick-pessoa-brand.png'" />
      <div>
        <div style="font-size: 7pt; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">
          Grupo GAPP Sistemas • Por Patrick Pessoa
        </div>
        <div class="title">ERP APURAÇÃO DO BOI • RELATÓRIO DA PLANILHA MATRIZ</div>
        <div style="font-size: 7.5pt; color: #475569;">
          Base de Desossa: <strong>${yieldBasis === 'carcass' ? 'Carcaça Inteira (240kg)' : 'Meia Carcaça (120kg)'}</strong> • 16 Filiais Integradas
        </div>
      </div>
    </div>
    <div style="text-align: right; font-size: 7.2pt; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 4px;">
      <div><strong>Data de Emissão:</strong> ${emissionDateFormatted} às ${emissionTimeFormatted}</div>
      <div style="font-family: monospace; font-size: 6.5pt; color: #64748b; margin-top: 1px;">Autenticação: ${hashAuth}</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-card">
      <div class="kpi-label">Valor Estimado do Lote</div>
      <div class="kpi-val" style="color: #166534;">${formatCurrencyBRL(estimatedTotal)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Volume Total (Kg)</div>
      <div class="kpi-val" style="color: #1e40af;">${formatNumberBR(estimatedWeight)} kg</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Peças Bovinas Pedidas</div>
      <div class="kpi-val" style="color: #b45309;">${formatNumberBR(totalPecas)} pç</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Estoque Câmaras</div>
      <div class="kpi-val" style="color: #475569;">${formatNumberBR(totalCamara)} pç</div>
    </div>
  </div>

  <table class="table-data">
    <thead>
      <tr>
        <th style="text-align: left; width: 22%;">Filial / Loja</th>
        <th>Ped. Diant.</th>
        <th>Ped. Tras.</th>
        <th>Ped. Coxão</th>
        <th>Ped. Alcat.</th>
        <th>Giro / Venda</th>
        <th>Boi (Fórmula)</th>
        <th>Sugestão</th>
        <th>Estoque Câmara</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r, i) => `
        <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="text-align: left; font-weight: 700;">${r.storeName}</td>
          <td>${r.pedidoDianteiro}</td>
          <td>${r.pedidoTraseiro}</td>
          <td>${r.pedidoCoxao}</td>
          <td>${r.pedidoAlcatrao}</td>
          <td style="color: #b45309; font-weight: bold;">${r.venda || r.boiAVenda || 0}</td>
          <td style="font-weight: bold;">${r.boi || 0}</td>
          <td style="font-weight: bold; color: ${(r.sugestaoPedido || 0) < 0 ? '#b91c1c' : '#047857'};">${r.sugestaoPedido || 0}</td>
          <td style="font-weight: 700;">${r.camaraDianteiro + r.somaDoTraseiro + r.camaraCostelaGaucha}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td style="text-align: left;">TOTAL CONSOLIDADO (16 LOJAS)</td>
        <td>${totalPedDianteiro}</td>
        <td>${totalPedTraseiro}</td>
        <td>${totalPedCoxao}</td>
        <td>${totalPedAlcatrao}</td>
        <td>${totalVenda}</td>
        <td>${totalBoi}</td>
        <td>${totalSugestao}</td>
        <td>${totalCamara}</td>
      </tr>
    </tfoot>
  </table>

  <div class="signatures">
    <div>
      <div class="sig-line"><strong>Diretoria Operacional</strong><br>Grupo GAPP Sistemas</div>
    </div>
    <div>
      <div class="sig-line"><strong>Gerência de Carnes & Desossa</strong><br>Patrick Pessoa</div>
    </div>
    <div>
      <div class="sig-line"><strong>Controladoria & Matriz</strong><br>Auditoria Oficial</div>
    </div>
  </div>

  <div style="margin-top: 10px; font-size: 6pt; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 3px;">
    <span>Grupo GAPP Sistemas • ERP Apuração do Boi v10.1 • Portal: www.gipp-site.vercel.app</span>
    <span>Emissão Oficial em ${new Date().toLocaleDateString('pt-BR')} • Página 1 de 1</span>
  </div>
</body>
</html>`;
  }
}
