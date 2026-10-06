import React, { useState } from 'react';
import { SheetRowData, Store, PurchaseBatch, Supplier } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR, recalculateRowOrderFormulas } from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { PrintPurchaseOrderModal } from './PrintPurchaseOrderModal';
import { 
  ShoppingCart, 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Building2, 
  Calendar, 
  DollarSign, 
  Scale, 
  FileText, 
  Sparkles,
  ArrowRight,
  Send,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Link2
} from 'lucide-react';
import ExcelJS from 'exceljs';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  stores: Store[];
  suppliers?: Supplier[];
  yieldParams?: { carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' };
  latestBatch?: PurchaseBatch;
  onOpenSupplierManager?: () => void;
  onSaveBatch?: (batch: PurchaseBatch) => void;
  onUpdateRow?: (updatedRow: SheetRowData) => void;
  onUpdateMultiple?: (rows: SheetRowData[]) => void;
  onUpdateYieldParams?: (params: any) => void;
}

const DEFAULT_SUPPLIERS = [
  'JBS S.A. / Friboi (Barra do Garças - MT)',
  'Minerva Foods S.A. (Araguaína - TO)',
  'Marfrig Global Foods (Mineiros - GO)',
  'Frigol S.A. Frigorífico (Lençóis Paulista - SP)',
  'Mataboi Alimentos S.A. (Araguari - MG)',
  'Frigorífico Rio Maria / Boi Gordo Agro (Rio Maria - PA)'
];

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  rows,
  stores,
  suppliers = [],
  yieldParams,
  latestBatch,
  onOpenSupplierManager,
  onSaveBatch,
  onUpdateRow,
  onUpdateMultiple,
  onUpdateYieldParams
}) => {
  const activeSuppliers = suppliers.filter(s => s.active);
  const initialSupplierName = activeSuppliers.length > 0
    ? (activeSuppliers[0].tradeName ? `${activeSuppliers[0].name} (${activeSuppliers[0].tradeName})` : activeSuppliers[0].name)
    : DEFAULT_SUPPLIERS[0];

  // Peso da Carcaça / Lote: Importado e vinculado SEMPRE do módulo de Análise Técnica de Rendimento e Desossa do Boi
  const masterTechnicalCarcassWeight = yieldParams?.carcassWeight || StorageService.getYieldParams()?.carcassWeight || 240;

  const [supplier, setSupplier] = useState(initialSupplierName);
  const [customSupplier, setCustomSupplier] = useState('');
  const [arrobaPrice, setArrobaPrice] = useState<number>(() => {
    if (yieldParams && yieldParams.costPerKg > 0) return Number((yieldParams.costPerKg * 15).toFixed(2));
    if (latestBatch && latestBatch.arrobaPrice > 0) return latestBatch.arrobaPrice;
    return 390.00;
  });
  const [carcassWeightPerBoiKg, setCarcassWeightPerBoiKg] = useState<number>(() => {
    if (yieldParams && yieldParams.carcassWeight > 0) return yieldParams.carcassWeight;
    const p = StorageService.getYieldParams();
    if (p && p.carcassWeight > 0) return p.carcassWeight;
    return 240;
  });
  const [notes, setNotes] = useState('Pedido emitido conforme apuração oficial da Matriz Direção v10.1. Entrega programada nas câmaras frigoríficas.');
  const [copiedToast, setCopiedToast] = useState(false);
  const [savedBatchSuccess, setSavedBatchSuccess] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [quantitiesSuino, setQuantitiesSuino] = useState<Record<string, number>>({});
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Carrega e sincroniza estritamente com a quantidade real lançada pelo usuário nas colunas Pedido (Boi e Banda)
  // e assume os parâmetros vigentes (Preço da @ e Peso da Carcaça / Lote do Módulo de Rendimento)
  React.useEffect(() => {
    if (isOpen) {
      const qMap: Record<string, number> = {};
      const qSuinoMap: Record<string, number> = {};
      rows.forEach(r => {
        // Assume estritamente a quantidade real lançada na planilha
        qMap[r.storeId] = Number(r.pedidoFinal !== undefined ? r.pedidoFinal : 0);
        qSuinoMap[r.storeId] = Number(r.bandaPedido !== undefined ? r.bandaPedido : (r.pedidoSuino !== undefined ? r.pedidoSuino : 0));
      });
      setQuantities(qMap);
      setQuantitiesSuino(qSuinoMap);

      // Sempre importa e vincula do módulo de análise técnica de rendimento e desossa do boi
      const masterWeight = (yieldParams && yieldParams.carcassWeight > 0)
        ? yieldParams.carcassWeight
        : (StorageService.getYieldParams()?.carcassWeight || 240);
      setCarcassWeightPerBoiKg(masterWeight);

      if (yieldParams && yieldParams.costPerKg > 0) {
        setArrobaPrice(Number((yieldParams.costPerKg * 15).toFixed(2)));
      } else if (latestBatch && latestBatch.arrobaPrice > 0) {
        setArrobaPrice(latestBatch.arrobaPrice);
      }
    }
  }, [isOpen, rows, yieldParams, latestBatch]);

  if (!isOpen) return null;

  const handleQuantityChange = (storeId: string, valStr: string) => {
    const parsed = parseFloat(valStr);
    const val = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setQuantities(prev => ({ ...prev, [storeId]: val }));

    if (onUpdateRow) {
      const targetRow = rows.find(r => r.storeId === storeId);
      if (targetRow) {
        onUpdateRow({
          ...targetRow,
          pedidoFinal: val
        });
      }
    }
  };

  const handleSuinoQuantityChange = (storeId: string, valStr: string) => {
    const parsed = parseFloat(valStr);
    const val = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setQuantitiesSuino(prev => ({ ...prev, [storeId]: val }));

    if (onUpdateRow) {
      const targetRow = rows.find(r => r.storeId === storeId);
      if (targetRow) {
        onUpdateRow({
          ...targetRow,
          bandaPedido: val,
          pedidoSuino: val
        });
      }
    }
  };

  const handleApplySuggestions = () => {
    const updatedMap: Record<string, number> = {};
    const updatedSuinoMap: Record<string, number> = {};
    const updatedRows = rows.map(r => {
      const dianteiro = Number(r.pedidoDianteiro) || 0;
      const traseiro = Number(r.pedidoTraseiro) || 0;
      const coxao = Number(r.pedidoCoxao) || 0;
      const alcatrao = Number(r.pedidoAlcatrao) || 0;
      const boi = Number(((dianteiro + traseiro + coxao + alcatrao) / 2).toFixed(1));
      const venda = Number(r.venda !== undefined ? r.venda : r.boiAVenda) || 0;
      const sugestao = Number((venda - boi).toFixed(1));
      const q = sugestao > 0 ? Math.ceil(sugestao) : 0;
      updatedMap[r.storeId] = q;

      const bandaPecas = Number(r.bandaPecas) || 0;
      const bandaVenda = Number(r.bandaVenda !== undefined ? r.bandaVenda : (r.vendaSuino !== undefined ? r.vendaSuino : 0)) || 0;
      const bandaSugestao = Number((bandaPecas - bandaVenda).toFixed(1));
      const qSuino = bandaSugestao > 0 ? Math.ceil(bandaSugestao) : 0;
      updatedSuinoMap[r.storeId] = qSuino;

      return { 
        ...r, 
        pedidoFinal: q,
        bandaPedido: qSuino,
        pedidoSuino: qSuino
      };
    });
    setQuantities(updatedMap);
    setQuantitiesSuino(updatedSuinoMap);
    if (onUpdateMultiple) {
      onUpdateMultiple(updatedRows);
    }
  };

  const handleZeroQuantities = () => {
    const updatedMap: Record<string, number> = {};
    const updatedSuinoMap: Record<string, number> = {};
    const updatedRows = rows.map(r => {
      updatedMap[r.storeId] = 0;
      updatedSuinoMap[r.storeId] = 0;
      return { 
        ...r, 
        pedidoFinal: 0,
        bandaPedido: 0,
        pedidoSuino: 0
      };
    });
    setQuantities(updatedMap);
    setQuantitiesSuino(updatedSuinoMap);
    if (onUpdateMultiple) {
      onUpdateMultiple(updatedRows);
    }
  };

  // Custo por kg de carcaça: R$ da @ dividido por 15 kg
  const pricePerKg = arrobaPrice / 15;

  const todayStr = new Date().toLocaleDateString('pt-BR');
  const deliveryDateObj = new Date();
  deliveryDateObj.setDate(deliveryDateObj.getDate() + 2);
  const deliveryDateStr = deliveryDateObj.toLocaleDateString('pt-BR');
  const orderNumber = `PC-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-001`;

  // Mapeamento e cálculo dos itens do pedido padrão para cada uma das 16 lojas
  const orderItems = rows.map((r) => {
    const dianteiro = Number(r.pedidoDianteiro) || 0;
    const traseiro = Number(r.pedidoTraseiro) || 0;
    const coxao = Number(r.pedidoCoxao) || 0;
    const alcatrao = Number(r.pedidoAlcatrao) || 0;
    const costela = Number(r.pedidoCostelaGaucha) || 0;
    
    // Regra oficial: Boi = (Dianteiro + Traseiro + Coxão + Alcatrão) / 2
    const boi = Math.round((dianteiro + traseiro + coxao + alcatrao) / 2);
    const venda = Math.round(Number(r.venda !== undefined ? r.venda : r.boiAVenda) || 0);
    const sugestao = Math.round(venda - boi);
    
    // Quantidade real que está lançada na quantidade de bois:
    const pedido = quantities[r.storeId] !== undefined 
      ? quantities[r.storeId] 
      : Number(r.pedidoFinal !== undefined ? r.pedidoFinal : 0);

    const estimatedWeightKg = Math.round(pedido * carcassWeightPerBoiKg);
    const estimatedTotalR$ = estimatedWeightKg * pricePerKg;

    // Suíno / Câmara / Balcão e Desossa
    const bandaPecas = Math.round(Number(r.bandaPecas) || 0);
    const bandaKg = Math.round(Number(r.bandaKg) || (bandaPecas * 36));
    const bandaVenda = Math.round(Number(r.bandaVenda !== undefined ? r.bandaVenda : (r.vendaSuino !== undefined ? r.vendaSuino : 0)) || 0);
    const bandaSugestao = Math.round(bandaPecas - bandaVenda);
    const bandaPedido = quantitiesSuino[r.storeId] !== undefined
      ? quantitiesSuino[r.storeId]
      : Math.round(Number(r.bandaPedido !== undefined ? r.bandaPedido : (r.pedidoSuino !== undefined ? r.pedidoSuino : 0)));
    const costelaSuina = Math.round(Number(r.costelaSuinaPecas) || 0);
    const pernil = Math.round(Number(r.pernilPecas) || 0);

    return {
      storeId: r.storeId,
      storeName: r.storeName,
      dianteiro,
      traseiro,
      coxao,
      alcatrao,
      costela,
      boi,
      venda,
      sugestao,
      pedido,
      estimatedWeightKg,
      estimatedTotalR$,
      // Suíno / Câmara / Balcão e Desossa
      bandaKg,
      bandaPecas,
      bandaVenda,
      bandaSugestao,
      bandaPedido,
      costelaSuina,
      pernil,
    };
  });

  // Totais consolidados Bovino
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

  // Totais consolidados Suíno (Câmara / Balcão e Desossa)
  const totalBandasPedidas = orderItems.reduce((acc, i) => acc + i.bandaPedido, 0);
  const totalBandaKg = orderItems.reduce((acc, i) => acc + i.bandaKg, 0);
  const totalBandaPecas = orderItems.reduce((acc, i) => acc + i.bandaPecas, 0);
  const totalBandaVenda = orderItems.reduce((acc, i) => acc + i.bandaVenda, 0);
  const totalBandaSugestao = orderItems.reduce((acc, i) => acc + i.bandaSugestao, 0);
  const totalCostelaSuina = orderItems.reduce((acc, i) => acc + i.costelaSuina, 0);
  const totalPernil = orderItems.reduce((acc, i) => acc + i.pernil, 0);
  const totalBandaEstimatedWeightKg = totalBandasPedidas * 36;

  const selectedSupplierName = customSupplier.trim() ? customSupplier : supplier;
  const selectedSupplierObj = suppliers.find(s => 
    s.name === selectedSupplierName || 
    (s.tradeName && `${s.name} (${s.tradeName})` === selectedSupplierName) ||
    selectedSupplierName.includes(s.name)
  );

  // 1. Gravar lote no ERP e assumir os dados em todas as áreas necessárias
  const handleSaveToERP = () => {
    if (!onSaveBatch) return;
    const newBatch: PurchaseBatch = {
      id: `batch_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      supplier: selectedSupplierName,
      invoiceNumber: orderNumber,
      headsCount: Math.round(totalBoisPedidos),
      totalGrossWeightKg: Math.round(totalWeightKg),
      arrobaPrice: arrobaPrice,
      totalCostR$: Math.round(totalCostR$ * 100) / 100,
      costPerKg: Math.round(pricePerKg * 100) / 100,
      targetStoreId: 'TODAS',
      status: 'PENDENTE',
      notes: notes ? `Pedido de Compra Padrão gerado pela Planilha da Direção v10.1 (${notes})` : `Pedido de Compra Padrão gerado pela Planilha da Direção v10.1`,
      deliveryDate: deliveryDateStr,
      items: orderItems,
    };

    // 1. Salva o lote no módulo de compras
    onSaveBatch(newBatch);

    // 2. Salva o registro completo do Pedido de Compras no banco de dados Firestore
    StorageService.savePurchaseOrder({
      id: `order_${orderNumber || Date.now()}`,
      orderNumber: orderNumber,
      date: todayStr || new Date().toISOString().slice(0, 10),
      deliveryDate: deliveryDateStr,
      supplier: selectedSupplierName,
      buyer: 'Patrick Pessoa (Direção de Carnes)',
      arrobaPrice: arrobaPrice,
      pricePerKg: pricePerKg,
      totalBois: Math.round(totalBoisPedidos),
      totalPieces: Math.round(totalBoisPedidos * 4),
      totalWeightKg: Math.round(totalWeightKg),
      totalCostR$: Math.round(totalCostR$ * 100) / 100,
      status: 'CONFIRMADO',
      notes: notes || 'Pedido gerado pela Planilha da Direção',
      items: orderItems,
    });

    // 3. ASSUME AS INFORMAÇÕES NOS DEMAIS CAMPOS (Planilha Oficial de Compras das 16 Lojas):
    // Cada filial assume:
    // - pedidoFinal = quantidade de bois pedida confirmada (item.pedido)
    // - bandaPedido = quantidade de bandas suínas pedida (item.bandaPedido)
    // - pedidoSuino = item.bandaPedido
    // - pTransito = quantidade de bois em trânsito assumida para a filial (item.pedido)
    const updatedRows = StorageService.propagateOrderToSheetRows(rows, orderItems.map(it => ({
      storeId: it.storeId,
      pedido: it.pedido,
      bandaPedido: it.bandaPedido
    })), { updateTransit: true });

    if (onUpdateMultiple) {
      onUpdateMultiple(updatedRows);
    }

    // 4. Salva Snapshot no Histórico da Planilha com data e identificador do Pedido
    const orderSnapshot = StorageService.createSnapshotFromRows(
      updatedRows,
      `Pedido Emitido: ${orderNumber} (${selectedSupplierName})`,
      'Patrick Pessoa (Direção)',
      'PURCHASE_ORDER',
      `Pedido oficial ${orderNumber} gerado para ${selectedSupplierName}. Quantidades e trânsito assumidos para as 16 filiais. Total: ${totalBoisPedidos} bois (${formatCurrencyBRL(totalCostR$)}).`
    );
    StorageService.addSheetSnapshot(orderSnapshot);

    // 5. ASSUME AS INFORMAÇÕES NOS PARÂMETROS GLOBAIS DE RENDIMENTO & DESOSSA:
    // Preço da arroba, custo/kg e peso da carcaça são assumidos em Rendimento, Desossa e Cálculos
    const updatedYieldParams = {
      carcassWeight: carcassWeightPerBoiKg,
      costPerKg: Number(pricePerKg.toFixed(2)),
      fatPriceKg: yieldParams?.fatPriceKg || 2.10,
      bonePriceKg: yieldParams?.bonePriceKg || 0.70,
      targetMargin: yieldParams?.targetMargin || 28,
      basis: yieldParams?.basis || ('carcass' as const)
    };
    StorageService.saveYieldParams(updatedYieldParams);
    if (onUpdateYieldParams) {
      onUpdateYieldParams(updatedYieldParams);
    }

    setSavedBatchSuccess(true);
    setTimeout(() => setSavedBatchSuccess(false), 5000);
  };

  // 2. Copiar texto estruturado para WhatsApp / E-mail
  const handleCopyText = () => {
    let text = `*GRUPO GAPP SISTEMAS - PEDIDO DE COMPRA PADRÃO*\n`;
    text += `*Número:* ${orderNumber} | *Data:* ${todayStr}\n`;
    text += `*Fornecedor:* ${selectedSupplierName}\n`;
    text += `*Comprador:* Patrick Pessoa (Direção de Operações)\n`;
    text += `*Preço Negociado:* R$ ${arrobaPrice.toFixed(2)}/@ (R$ ${pricePerKg.toFixed(2)}/kg)\n`;
    text += `*Previsão de Entrega:* ${deliveryDateStr}\n\n`;
    text += `*1. CONSOLIDAÇÃO GERAL - BOVINO:*\n`;
    text += `• Total de Bois Pedidos: ${totalBoisPedidos} cabeças\n`;
    text += `• Peso Total Estimado Bovino: ${formatNumberBR(totalWeightKg, 1)} kg\n`;
    text += `• Valor Total Bovino: ${formatCurrencyBRL(totalCostR$)}\n\n`;
    text += `*2. CONSOLIDAÇÃO GERAL - CÂMARA / BALCÃO E DESOSSA (SUÍNO):*\n`;
    text += `• Total de Bandas Pedidas: ${totalBandasPedidas} peças (${formatNumberBR(totalBandaEstimatedWeightKg, 1)} kg)\n`;
    text += `• Costela Suína Total: ${totalCostelaSuina} peças | Pernil Total: ${totalPernil} peças\n\n`;
    text += `*DISTRIBUIÇÃO DETALHADA POR LOJA (16 FILIAIS):*\n`;

    orderItems.forEach((item, idx) => {
      text += `${idx + 1}. *${item.storeName}*:\n`;
      text += `   • BOI: Pedido: ${item.pedido} bois (${item.estimatedWeightKg.toFixed(0)} kg | ${formatCurrencyBRL(item.estimatedTotalR$)}) [Diant: ${item.dianteiro}, Tras: ${item.traseiro}, Coxão: ${item.coxao}, Alcat: ${item.alcatrao}, Boi Calc: ${item.boi}, Venda: ${item.venda}, Sug: ${item.sugestao}]\n`;
      text += `   • SUÍNO/BANDA: Pedido: ${item.bandaPedido} pç (${item.bandaPedido * 36} kg) [Banda Kg: ${item.bandaKg}, Banda Pç: ${item.bandaPecas}, Venda: ${item.bandaVenda}, Sug: ${item.bandaSugestao}, Cost. Suína: ${item.costelaSuina}, Pernil: ${item.pernil}]\n`;
    });

    text += `\n*Observações:* ${notes}\n`;
    text += `\n_Emitido via Grupo GAPP Sistemas - Sistema de Apuração do Boi por Patrick Pessoa_`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // 3. Imprimir versão limpa timbrada (abre a prévia oficial do PDF com opção de imprimir)
  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  // 4. Exportar pedido de compra padrão para Excel (.xlsx)
  const handleExportOrderXLSX = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Grupo GAPP Sistemas - Patrick Pessoa';
    const ws = workbook.addWorksheet('Pedido de Compra Padrão');

    ws.mergeCells('A1:S1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'GRUPO GAPP SISTEMAS • PEDIDO DE COMPRA PADRÃO (BOVINO & SUÍNO)';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004B87' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:S2');
    const subCell = ws.getCell('A2');
    subCell.value = `Pedido: ${orderNumber} • Emissão: ${todayStr} • Previsão: ${deliveryDateStr} • Fornecedor: ${selectedSupplierName} • Responsável: Patrick Pessoa`;
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF334155' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 20;

    // Header Tier 1: Group Names
    ws.mergeCells('B3:L3');
    const gBov = ws.getCell('B3');
    gBov.value = 'DADOS PARA A GERAÇÃO DE PEDIDO (BOVINO)';
    gBov.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    gBov.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    gBov.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells('M3:S3');
    const gSuin = ws.getCell('M3');
    gSuin.value = 'CÂMARA / BALCÃO E DESOSSA (SUÍNO / BANDA)';
    gSuin.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    gSuin.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    gSuin.alignment = { horizontal: 'center', vertical: 'middle' };

    // Headers
    const headers = [
      'Loja / Filial',
      'Dianteiro (Pç)',
      'Traseiro (Pç)',
      'Coxão (Pç)',
      'Alcatrão (Pç)',
      'Costela Gaúcha',
      'Boi Calc. (D+T+C+A)/2',
      'Venda (Boi)',
      'Sugestão (Boi)',
      'Qtd. Pedido (Bois)',
      'Peso Estimado (kg)',
      'Valor Estimado (R$)',
      // Suíno / Câmara / Balcão e Desossa
      'Banda Kg (Pç×36)',
      'Banda (Pç)',
      'Venda (Banda)',
      'Sugestão (Banda)',
      'Qtd. Pedido (Banda)',
      'Cost. Suína (Pç)',
      'Pernil (Pç)'
    ];

    ws.getRow(4).height = 24;
    headers.forEach((h, i) => {
      const cell = ws.getCell(4, i + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i >= 12 ? 'FF0F766E' : 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    orderItems.forEach((item, idx) => {
      const rowNum = 5 + idx;
      ws.getRow(rowNum).height = 20;
      const isEven = idx % 2 === 0;
      const bgHex = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      const rowVals = [
        item.storeName,
        item.dianteiro,
        item.traseiro,
        item.coxao,
        item.alcatrao,
        item.costela,
        item.boi,
        item.venda,
        item.sugestao,
        item.pedido,
        item.estimatedWeightKg,
        item.estimatedTotalR$,
        // Suíno
        item.bandaKg,
        item.bandaPecas,
        item.bandaVenda,
        item.bandaSugestao,
        item.bandaPedido,
        item.costelaSuina,
        item.pernil
      ];

      rowVals.forEach((val, cIdx) => {
        const cell = ws.getCell(rowNum, cIdx + 1);
        cell.value = val;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgHex } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        if (cIdx === 0) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true };
        } else if (cIdx === 11) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF065F46' } };
          cell.numFmt = '"R$ "#,##0.00';
        } else if (cIdx === 10) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0.0';
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = typeof val === 'number' && !Number.isInteger(val) ? '#,##0.0' : '#,##0';
        }
      });
    });

    // Total row
    const totRow = 5 + orderItems.length;
    ws.getRow(totRow).height = 24;
    ws.getCell(totRow, 1).value = 'TOTAL GERAL CONSOLIDADO';
    ws.getCell(totRow, 1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getCell(totRow, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };

    const totalsValues = [
      totalDianteiro, totalTraseiro, totalCoxao, totalAlcatrao, totalCostela,
      totalBoiEquivalente, totalVenda, totalSugestao, totalBoisPedidos, totalWeightKg, totalCostR$,
      // Suíno totals
      totalBandaKg, totalBandaPecas, totalBandaVenda, totalBandaSugestao, totalBandasPedidas, totalCostelaSuina, totalPernil
    ];

    totalsValues.forEach((tVal, tIdx) => {
      const cell = ws.getCell(totRow, tIdx + 2);
      cell.value = tVal;
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (tIdx === 10) cell.numFmt = '"R$ "#,##0.00';
      else if (tIdx === 9 || tIdx === 5 || tIdx === 7 || tIdx === 11 || tIdx === 14) cell.numFmt = '#,##0.0';
      else cell.numFmt = '#,##0';
    });

    ws.getColumn(1).width = 28;
    for (let c = 2; c <= 19; c++) ws.getColumn(c).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pedido_Compra_Padrao_GAPP_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      <div 
        className={`w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] ${
          isPrintPreviewOpen 
            ? 'print:hidden' 
            : 'print:max-h-none print:shadow-none print:border-none print:rounded-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Hidden on Print) */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-amber-600 text-white flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">PEDIDO DE COMPRA DE BOI PADRÃO</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                  {orderNumber}
                </span>
              </div>
              <p className="text-xs text-white/80">
                Grupo GAPP Sistemas • Emitido com base no cabeçalho operacional da Planilha v10.1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              title="Imprimir documento oficial ou salvar PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              onClick={handleExportOrderXLSX}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Baixar planilha deste pedido em Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Excel .XLSX</span>
            </button>

            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Copiar espelho do pedido formatado para WhatsApp ou E-mail"
            >
              {copiedToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedToast ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition ml-1"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success banner inside modal with detailed assumed fields */}
        {savedBatchSuccess && (
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-5 py-3 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg border-b border-emerald-500/30 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <span>Pedido e Lote salvos com sucesso no banco de dados!</span>
                <p className="text-[11px] font-normal text-emerald-100 mt-0.5">
                  Dados assumidos automaticamente na <strong>Planilha de Compras</strong> (Pedido e Trânsito das 16 lojas) e nos parâmetros de <strong>Rendimento & Desossa</strong> (R$ {arrobaPrice.toFixed(2)}/@ • R$ {pricePerKg.toFixed(2)}/kg).
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-900/80 border border-emerald-400/40 px-2.5 py-1 rounded-md text-emerald-200 shrink-0">
              Assumido no ERP
            </span>
          </div>
        )}

        {/* Scrollable Printable Document Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-100 print:p-0 print:overflow-visible">
          
          {/* Document Printable Header */}
          <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/50 print:bg-white print:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Matriz Central de Abastecimento
                </span>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  GRUPO GAPP SISTEMAS
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Sistema de Gestão e Apuração de Compra do Boi • Patrick Pessoa
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-6">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block font-mono">
                  {orderNumber}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">
                  Data de Emissão: <strong>{todayStr}</strong>
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-medium">
                  Previsão de Entrega: <strong>{deliveryDateStr}</strong>
                </span>
              </div>
            </div>

            {/* Editable Control Fields (Hidden in Print) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 print:grid-cols-4 print:text-xs text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Fornecedor Frigorífico:
                  </label>
                  {onOpenSupplierManager && (
                    <button
                      type="button"
                      onClick={onOpenSupplierManager}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                      title="Gerenciar e cadastrar fornecedores de gado"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Cadastros</span>
                    </button>
                  )}
                </div>
                <select
                  value={supplier}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSupplier(val);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                >
                  {activeSuppliers.length > 0 ? (
                    activeSuppliers.map(s => {
                      const optVal = s.tradeName ? `${s.name} (${s.tradeName})` : s.name;
                      const displayLabel = `${s.name}${s.tradeName ? ` - ${s.tradeName}` : ''} (${s.city}/${s.state}${s.sifNumber ? ` • ${s.sifNumber}` : ''})`;
                      return (
                        <option key={s.id} value={optVal}>
                          {displayLabel}
                        </option>
                      );
                    })
                  ) : (
                    DEFAULT_SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Preço da Arroba (@):
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    value={arrobaPrice}
                    onChange={(e) => setArrobaPrice(Number(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap">
                    (= R$ {pricePerKg.toFixed(2)}/kg)
                  </span>
                </div>
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-800/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    Peso da Carcaça / Lote:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const master = (yieldParams && yieldParams.carcassWeight > 0)
                        ? yieldParams.carcassWeight
                        : (StorageService.getYieldParams()?.carcassWeight || 240);
                      setCarcassWeightPerBoiKg(master);
                    }}
                    className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                    title={`Importado do Módulo de Análise Técnica de Rendimento e Desossa (${masterTechnicalCarcassWeight} kg)`}
                  >
                    <Link2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Importado do Rendimento</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="50"
                    step="5"
                    value={carcassWeightPerBoiKg}
                    onChange={(e) => setCarcassWeightPerBoiKg(Number(e.target.value) || masterTechnicalCarcassWeight)}
                    className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold whitespace-nowrap">
                    kg (= {(carcassWeightPerBoiKg / 15).toFixed(1)} @)
                  </span>
                </div>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 block">
                  🔗 Vinculado à Análise Técnica de Rendimento e Desossa
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Comprador Responsável:
                </label>
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Patrick Pessoa (GRUPO GAPP)
                </div>
              </div>
            </div>
          </div>

          {/* Consolidated KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider block">
                Total Bois Pedidos
              </span>
              <span className="text-lg font-bold font-mono text-blue-950 dark:text-blue-100">
                {totalBoisPedidos} <span className="text-xs font-normal text-slate-500">cabeças</span>
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5">
                Consolidado 16 filiais
              </span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider block">
                Peças Bovinas
              </span>
              <span className="text-lg font-bold font-mono text-amber-950 dark:text-amber-100">
                {totalDianteiro + totalTraseiro + totalCoxao + totalAlcatrao + totalCostela} <span className="text-xs font-normal text-slate-500">peças</span>
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
                D: {totalDianteiro} | T: {totalTraseiro} | C: {totalCoxao} | A: {totalAlcatrao}
              </span>
            </div>

            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 tracking-wider block">
                Bandas Suínas
              </span>
              <span className="text-lg font-bold font-mono text-teal-950 dark:text-teal-100">
                {totalBandasPedidas} <span className="text-xs font-normal text-slate-500">peças</span>
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 block mt-0.5">
                ~{formatNumberBR(totalBandaEstimatedWeightKg, 0)} kg (36kg/pç)
              </span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 tracking-wider block">
                Peso Estimado Boi
              </span>
              <span className="text-lg font-bold font-mono text-purple-950 dark:text-purple-100">
                {formatNumberBR(totalWeightKg, 1)} <span className="text-xs font-normal text-slate-500">kg</span>
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-0.5">
                ~{(totalWeightKg / 15).toFixed(1)} arrobas brutas
              </span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider block">
                Valor Total Bovino
              </span>
              <span className="text-lg font-bold font-mono text-emerald-900 dark:text-emerald-300">
                {formatCurrencyBRL(totalCostR$)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                Validação oficial
              </span>
            </div>
          </div>

          {/* Detailed per-store Table based on "DADOS PARA A GERAÇÃO DE PEDIDO" + "CÂMARA / BALCÃO E DESOSSA" */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Quadro de Distribuição por Loja (Bovino & Suíno / Câmara / Balcão e Desossa)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Qtd Real
                </span>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handleApplySuggestions}
                  className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition"
                  title="Copiar sugestões calculadas (Boi e Banda Suína) para o pedido de todas as lojas"
                >
                  Preencher c/ Sugestão
                </button>
                <button
                  onClick={handleZeroQuantities}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition"
                  title="Zerar as quantidades lançadas de todas as lojas"
                >
                  Zerar Tudo
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  {/* Tier 1 Header */}
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-slate-100 dark:bg-slate-900">Filial</th>
                    <th colSpan={11} className="px-3 py-1.5 text-center bg-blue-100/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-r border-slate-200 dark:border-slate-800 font-bold">
                      DADOS PARA A GERAÇÃO DE PEDIDO (BOVINO)
                    </th>
                    <th colSpan={6} className="px-3 py-1.5 text-center bg-teal-100/70 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-bold">
                      CÂMARA / BALCÃO E DESOSSA (SUÍNO / BANDA)
                    </th>
                  </tr>
                  {/* Tier 2 Header */}
                  <tr>
                    {/* Bovino */}
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">Diant</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">Tras</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">Coxão</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">Alcat</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">Cost. G</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-bold" title="(Dianteiro + Traseiro + Coxão + Alcatrão) / 2">
                      Boi Calc
                    </th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400">Venda</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-400" title="Venda - Boi">Sugestão</th>
                    <th className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold" title="Quantidade de bois lançada">
                      Pedido Boi
                    </th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-800">Peso Est.</th>
                    <th className="px-2 py-1.5 text-right border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-800 dark:text-emerald-300">Valor (R$)</th>

                    {/* Suíno */}
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-teal-700 dark:text-teal-300">Banda Pç</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400">Venda</th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-rose-700 dark:text-rose-400" title="Sugestão = Banda Pç - Venda">Sugestão</th>
                    <th className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 font-bold" title="Quantidade de bandas pedidas">
                      Pedido Banda
                    </th>
                    <th className="px-1.5 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">Cost. Suína</th>
                    <th className="px-1.5 py-1.5 text-center">Pernil</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                  {orderItems.map((item, idx) => (
                    <tr key={item.storeId} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/40'}>
                      <td className="px-3 py-2 font-sans font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-inherit whitespace-nowrap">
                        {item.storeName}
                      </td>
                      {/* Bovino */}
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">{item.dianteiro}</td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">{item.traseiro}</td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">{item.coxao}</td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">{item.alcatrao}</td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">{item.costela}</td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/20">
                        {item.boi % 1 !== 0 ? item.boi.toFixed(1) : item.boi}
                      </td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-amber-700 dark:text-amber-400">{item.venda}</td>
                      <td className={`px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold ${
                        item.sugestao < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {item.sugestao > 0 ? `+${item.sugestao}` : item.sugestao}
                      </td>
                      <td className="px-2 py-1 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30">
                        <div className="flex items-center justify-center print:hidden">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.pedido}
                            onChange={(e) => handleQuantityChange(item.storeId, e.target.value)}
                            className="w-14 text-center py-1 px-1 rounded-md border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold font-mono text-indigo-800 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs text-xs"
                            title="Quantidade de bois lançada para esta filial."
                          />
                        </div>
                        <span className="hidden print:inline font-bold font-mono text-slate-900">
                          {item.pedido}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {formatNumberBR(item.estimatedWeightKg, 1)}
                      </td>
                      <td className="px-2 py-2 text-right border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrencyBRL(item.estimatedTotalR$)}
                      </td>

                      {/* Suíno */}
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-teal-700 dark:text-teal-300">{item.bandaPecas}</td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-amber-700 dark:text-amber-400">{item.bandaVenda}</td>
                      <td className={`px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold ${
                        item.bandaSugestao < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {item.bandaSugestao > 0 ? `+${item.bandaSugestao}` : item.bandaSugestao}
                      </td>
                      <td className="px-2 py-1 text-center border-r border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30">
                        <div className="flex items-center justify-center print:hidden">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.bandaPedido}
                            onChange={(e) => handleSuinoQuantityChange(item.storeId, e.target.value)}
                            className="w-14 text-center py-1 px-1 rounded-md border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold font-mono text-indigo-800 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs text-xs"
                            title="Quantidade de bandas suínas lançada para esta filial."
                          />
                        </div>
                        <span className="hidden print:inline font-bold font-mono text-slate-900">
                          {item.bandaPedido}
                        </span>
                      </td>
                      <td className="px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800">{item.costelaSuina}</td>
                      <td className="px-1.5 py-2 text-center">{item.pernil}</td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer Totals */}
                <tfoot className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold text-[11px] border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="px-3 py-2.5 font-sans font-bold border-r border-slate-300 dark:border-slate-700 sticky left-0 z-10 bg-inherit">
                      TOTAL CONSOLIDADO
                    </td>
                    {/* Bovino */}
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalDianteiro}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalTraseiro}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalCoxao}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalAlcatrao}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalCostela}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-950/50">
                      {Math.round(totalBoiEquivalente)}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-400">{totalVenda}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{Math.round(totalSugestao)}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-950/50">
                      {totalBoisPedidos}
                    </td>
                    <td className="px-2 py-2 text-right border-r border-slate-300 dark:border-slate-700 text-purple-700 dark:text-purple-300">
                      {formatNumberBR(totalWeightKg, 0)}
                    </td>
                    <td className="px-2 py-2 text-right border-r border-slate-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 font-bold">
                      {formatCurrencyBRL(totalCostR$)}
                    </td>

                    {/* Suíno */}
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-teal-700 dark:text-teal-300">{totalBandaPecas}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700 font-bold text-amber-700 dark:text-amber-400">{totalBandaVenda}</td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{Math.round(totalBandaSugestao)}</td>
                    <td className="px-2 py-2 text-center border-r border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-950/50 font-bold">
                      {totalBandasPedidas}
                    </td>
                    <td className="px-1.5 py-2 text-center border-r border-slate-300 dark:border-slate-700">{totalCostelaSuina}</td>
                    <td className="px-1.5 py-2 text-center">{totalPernil}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Observações Operacionais do Pedido:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="Instruções de entrega, horário de descarregamento, etc."
            />
          </div>

          {/* Signatures on Print */}
          <div className="pt-6 hidden print:grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-slate-800 pt-2">
              <span className="font-bold block">Patrick Pessoa</span>
              <span className="text-[10px] text-slate-500 block">Comprador / Direção GRUPO GAPP</span>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <span className="font-bold block">Gerência de Câmaras & Logística</span>
              <span className="text-[10px] text-slate-500 block">Conferência e Recebimento Matriz</span>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <span className="font-bold block">{selectedSupplierName}</span>
              <span className="text-[10px] text-slate-500 block">Aceite do Frigorífico Fornecedor</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions (Hidden on Print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Ao gravar no ERP, este pedido gerará automaticamente um novo lote frigorífico oficial no módulo de Compras.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              Voltar à Planilha
            </button>

            {onSaveBatch && (
              <button
                onClick={handleSaveToERP}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar & Gravar no Módulo de Compras (Lotes)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prévia do PDF do Pedido de Compra com opção de imprimir */}
      {isPrintPreviewOpen && (
        <PrintPurchaseOrderModal
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          rows={rows}
          stores={stores}
          supplierName={selectedSupplierName}
          supplierDetails={selectedSupplierObj}
          orderNumber={orderNumber}
          todayStr={todayStr}
          deliveryDateStr={deliveryDateStr}
          arrobaPrice={arrobaPrice}
          pricePerKg={pricePerKg}
          carcassWeightPerBoiKg={carcassWeightPerBoiKg}
          notes={notes}
          orderItems={orderItems}
        />
      )}
    </div>
  );
};
