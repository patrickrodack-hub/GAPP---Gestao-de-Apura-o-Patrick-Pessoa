import React, { useState } from 'react';
import { SheetRowData, Store, Supplier } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { PrintEngineService } from '../../services/printEngineService';
import { PdfReportService } from '../../services/pdfReportService';
import { WhatsAppShareService } from '../../services/whatsAppShareService';
import { 
  Printer, 
  X, 
  ShoppingCart, 
  Building2, 
  Calendar, 
  Scale, 
  ShieldCheck, 
  Sparkles,
  MessageCircle,
  FileDown,
  CheckCircle2
} from 'lucide-react';

interface PrintPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  stores: Store[];
  supplierName: string;
  supplierDetails?: Supplier;
  orderNumber: string;
  todayStr: string;
  deliveryDateStr: string;
  arrobaPrice: number;
  pricePerKg: number;
  alcatraoCostKg?: number;
  costelaCostKg?: number;
  bandaCostKg?: number;
  carcassWeightPerBoiKg: number;
  notes: string;
  orderItems: {
    storeId: string;
    storeName: string;
    dianteiro: number;
    traseiro: number;
    coxao: number;
    alcatrao: number;
    pedidoAlcatraoReal?: number;
    costela: number;
    pedidoCostelaReal?: number;
    boi: number;
    venda: number;
    sugestao: number;
    pedido: number;
    estimatedWeightKg: number;
    estimatedTotalR$: number;
    bandaKg: number;
    bandaPecas: number;
    bandaVenda: number;
    bandaSugestao: number;
    bandaPedido: number;
    costelaSuina: number;
    pernil: number;
  }[];
}

export const PrintPurchaseOrderModal: React.FC<PrintPurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  supplierName,
  supplierDetails,
  orderNumber,
  todayStr,
  deliveryDateStr,
  arrobaPrice,
  pricePerKg,
  alcatraoCostKg = 29.00,
  costelaCostKg = 25.50,
  bandaCostKg = 26.00,
  carcassWeightPerBoiKg,
  notes,
  orderItems,
}) => {
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  if (!isOpen) return null;

  // Bovino totals
  const totalBoisPedidos = orderItems.reduce((acc, i) => acc + i.pedido, 0);
  const totalDianteiro = orderItems.reduce((acc, i) => acc + i.dianteiro, 0);
  const totalTraseiro = orderItems.reduce((acc, i) => acc + i.traseiro, 0);
  const totalCoxao = orderItems.reduce((acc, i) => acc + i.coxao, 0);
  const totalAlcatrao = orderItems.reduce((acc, i) => acc + i.alcatrao, 0);
  const totalPedAlcatrao = orderItems.reduce((acc, i) => acc + (i.pedidoAlcatraoReal || 0), 0);
  const totalCostela = orderItems.reduce((acc, i) => acc + i.costela, 0);
  const totalPedCostela = orderItems.reduce((acc, i) => acc + (i.pedidoCostelaReal || 0), 0);
  const totalBoiEquivalente = orderItems.reduce((acc, i) => acc + i.boi, 0);
  const totalVenda = orderItems.reduce((acc, i) => acc + i.venda, 0);
  const totalSugestao = orderItems.reduce((acc, i) => acc + i.sugestao, 0);
  const totalWeightKg = orderItems.reduce((acc, i) => acc + i.estimatedWeightKg, 0);
  const totalCostR$ = orderItems.reduce((acc, i) => acc + i.estimatedTotalR$, 0);

  // Suíno totals
  const totalBandaKg = orderItems.reduce((acc, i) => acc + (i.bandaKg || 0), 0);
  const totalBandaPecas = orderItems.reduce((acc, i) => acc + (i.bandaPecas || 0), 0);
  const totalBandaVenda = orderItems.reduce((acc, i) => acc + (i.bandaVenda || 0), 0);
  const totalBandaSugestao = orderItems.reduce((acc, i) => acc + (i.bandaSugestao || 0), 0);
  const totalBandasPedidas = orderItems.reduce((acc, i) => acc + (i.bandaPedido || 0), 0);
  const totalCostelaSuina = orderItems.reduce((acc, i) => acc + (i.costelaSuina || 0), 0);
  const totalPernil = orderItems.reduce((acc, i) => acc + (i.pernil || 0), 0);
  const totalBandaEstimatedWeightKg = totalBandasPedidas * 36;

  const handlePrint = () => {
    const printHtml = PrintEngineService.generatePurchaseOrderHtml({
      supplierName,
      supplierDetails,
      orderNumber,
      todayStr,
      deliveryDateStr,
      arrobaPrice,
      pricePerKg,
      alcatraoCostKg,
      costelaCostKg,
      bandaCostKg,
      carcassWeightPerBoiKg,
      notes,
      orderItems,
    });

    PrintEngineService.printDocument(printHtml, {
      documentTitle: `Pedido_${orderNumber}_${supplierName}`,
      landscape: true,
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setPdfSuccess(false);
      await PdfReportService.generateAndDownloadPurchaseOrderPdf({
        supplierName,
        supplierDetails,
        orderNumber,
        todayStr,
        deliveryDateStr,
        arrobaPrice,
        pricePerKg,
        alcatraoCostKg,
        costelaCostKg,
        bandaCostKg,
        carcassWeightPerBoiKg,
        notes,
        orderItems,
        currentUser: 'Patrick Pessoa (Diretoria de Compras)'
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao gerar PDF do pedido:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsSharingWhatsApp(true);
      setWhatsappSuccess(false);
      await WhatsAppShareService.sharePurchaseOrderPdfViaWhatsApp({
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
        currentUser: 'Patrick Pessoa (Diretoria de Compras)',
        targetPhone: supplierDetails?.phone
      });
      setWhatsappSuccess(true);
      setTimeout(() => setWhatsappSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao enviar PDF do pedido por WhatsApp:', err);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-5xl w-full shadow-2xl flex flex-col my-auto max-h-[96vh] overflow-hidden border border-slate-300">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-3 bg-gradient-to-r from-[#004b87] to-[#0078d7] text-white print:hidden shadow-md gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20">
              <ShoppingCart className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Prévia de Impressão • Pedido de Compra Padrão
              </h3>
              <p className="text-[11px] text-blue-100">
                Grupo GAPP Sistemas • Documento Oficial de Fornecimento de Gado
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Baixar Pedido de Compra em formato PDF"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>PDF Baixado!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            {/* Enviar PDF por WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWhatsApp}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                whatsappSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Enviar o documento em PDF e espelho do pedido diretamente para o WhatsApp do Frigorífico"
            >
              {isSharingWhatsApp ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparando WhatsApp...</span>
                </>
              ) : whatsappSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enviado!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar PDF por WhatsApp</span>
                </>
              )}
            </button>

            {/* Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
              title="Imprimir documento oficial ou Salvar como PDF via sistema"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (Simulates A4 Paper) */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 space-y-5 text-slate-900 font-sans">
            
            {/* 1. Header do Documento */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-900 text-white px-2 py-0.5 rounded">
                      Documento Oficial de Compra
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      v10.7 MATRIZ
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                    GRUPO GAPP SISTEMAS
                  </h1>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                    PEDIDO DE COMPRA DE BOI PADRÃO
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Direção de Operações & Suprimentos • Patrick Pessoa
                  </p>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l sm:border-slate-300 pt-2 sm:pt-0 sm:pl-6">
                  <span className="text-sm font-mono font-bold text-blue-800 block">
                    {orderNumber}
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Emissão: <strong>{todayStr}</strong>
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold block">
                    Previsão de Entrega: <strong>{deliveryDateStr}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Dados do Fornecedor e Negociação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Fornecedor Frigorífico
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {supplierDetails?.name || supplierName}
                </div>
                {supplierDetails && (
                  <div className="text-[11px] text-slate-600 space-y-0.5 mt-1 font-mono">
                    <div>CNPJ: <strong>{supplierDetails.cnpj}</strong> {supplierDetails.sifNumber ? `• ${supplierDetails.sifNumber}` : ''}</div>
                    <div>Planta: {supplierDetails.city} / {supplierDetails.state} {supplierDetails.contactName ? `• Contato: ${supplierDetails.contactName}` : ''}</div>
                    {supplierDetails.phone && <div>Tel/WhatsApp: {supplierDetails.phone}</div>}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Condições Comerciais Negociadas
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Preço da Arroba (@):</span>
                    <strong className="text-red-600 font-mono text-xs font-bold">R$ {arrobaPrice.toFixed(2)}</strong>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">(= R$ {pricePerKg.toFixed(2)}/kg)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Custos Cortes Negociados:</span>
                    <div className="text-[10px] text-slate-700 font-mono space-y-0.5">
                      <div>Alcatrão: <strong className="text-indigo-700">R$ {alcatraoCostKg.toFixed(2)}/kg</strong></div>
                      <div>Costela G: <strong className="text-indigo-700">R$ {costelaCostKg.toFixed(2)}/kg</strong></div>
                      <div>Banda Suína: <strong className="text-teal-700">R$ {bandaCostKg.toFixed(2)}/kg</strong></div>
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-slate-200 pt-1 mt-1">
                    <span className="text-slate-500">Prazo de Pagamento: </span>
                    <strong className="text-slate-800">{supplierDetails?.paymentTerms || '14 dias / Boleto Frigorífico'}</strong>
                    <span className="text-slate-500 ml-2">• Base Carcaça: <strong>{carcassWeightPerBoiKg} kg</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Resumo Executivo em Destaque */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">Total de Bois Pedidos</span>
                <span className="text-lg font-black font-mono text-blue-950">{totalBoisPedidos} cabeças</span>
              </div>
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-teal-700 block">Bandas Suínas Pedidas</span>
                <span className="text-lg font-black font-mono text-teal-950">{totalBandasPedidas} peças</span>
                <span className="text-[9px] text-teal-600 block mt-0.5">~{formatNumberBR(totalBandaEstimatedWeightKg, 0)} kg</span>
              </div>
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-purple-700 block">Peso Total Estimado (Boi)</span>
                <span className="text-lg font-black font-mono text-purple-950">{formatNumberBR(totalWeightKg, 1)} kg</span>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Valor Financeiro Bovino</span>
                <span className="text-lg font-black font-mono text-emerald-900">{formatCurrencyBRL(totalCostR$)}</span>
              </div>
            </div>

            {/* 4. Quadro Analítico por Loja com as Quantidades Pedidas */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-800 flex justify-between items-center">
                <span className="text-slate-800 font-extrabold">AJUSTAR QUANTIDADES PEDIDAS POR FILIAL</span>
                <span className="text-[11px] font-bold text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-300">
                  {orderItems.length} LOJAS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-300 font-bold uppercase text-slate-700 text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5 border-r border-slate-200 bg-slate-100 font-extrabold">
                        LOJA
                      </th>
                      <th className="px-2.5 py-2.5 text-center border-r border-slate-200 bg-indigo-50/70 text-indigo-900 font-extrabold">
                        BOI (PEDIDO)
                      </th>
                      <th className="px-2.5 py-2.5 text-center border-r border-slate-200 bg-purple-50/70 text-purple-900 font-extrabold">
                        PED. ALCATRÃO
                      </th>
                      <th className="px-2.5 py-2.5 text-center border-r border-slate-200 bg-purple-50/70 text-purple-900 font-extrabold">
                        PED. COSTELA
                      </th>
                      <th className="px-2.5 py-2.5 text-center border-r border-slate-200 bg-teal-50/70 text-teal-900 font-extrabold">
                        SUÍNO / BANDA
                      </th>
                      <th className="px-3 py-2.5 text-right border-r border-slate-200 bg-slate-50 text-slate-800 font-extrabold">
                        PESO ESTIMADO (KG)
                      </th>
                      <th className="px-3 py-2.5 text-right bg-emerald-50/70 text-emerald-900 font-extrabold">
                        VALOR ESTIMADO (R$)
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {orderItems.map((item, idx) => (
                      <tr key={item.storeId} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 hover:bg-slate-100/80'}>
                        <td className="px-4 py-2 font-sans font-bold text-slate-800 border-r border-slate-200">
                          {item.storeName}
                        </td>
                        <td className="px-2.5 py-2 text-center border-r border-slate-200 font-black text-indigo-900 bg-indigo-50/40 text-sm">
                          {item.pedido}
                        </td>
                        <td className="px-2.5 py-2 text-center border-r border-slate-200 font-black text-purple-900 bg-purple-50/40 text-sm">
                          {item.pedidoAlcatraoReal || 0}
                        </td>
                        <td className="px-2.5 py-2 text-center border-r border-slate-200 font-black text-purple-900 bg-purple-50/40 text-sm">
                          {item.pedidoCostelaReal || 0}
                        </td>
                        <td className="px-2.5 py-2 text-center border-r border-slate-200 font-black text-teal-900 bg-teal-50/40 text-sm">
                          {item.bandaPedido || 0}
                        </td>
                        <td className="px-3 py-2 text-right border-r border-slate-200 font-semibold text-slate-700">
                          {formatNumberBR(item.estimatedWeightKg, 0)} kg
                        </td>
                        <td className="px-3 py-2 text-right font-black text-emerald-700">
                          {formatCurrencyBRL(item.estimatedTotalR$)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Linha de Totais Gerais Consolidados */}
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-xs font-mono text-slate-900">
                    <tr>
                      <td className="px-4 py-2.5 font-sans font-extrabold border-r border-slate-300">
                        TOTAL GERAL ({orderItems.length} LOJAS)
                      </td>
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-300 bg-indigo-100/80 text-indigo-950 font-black text-sm">
                        {totalBoisPedidos}
                      </td>
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-300 bg-purple-100/80 text-purple-950 font-black text-sm">
                        {totalPedAlcatrao}
                      </td>
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-300 bg-purple-100/80 text-purple-950 font-black text-sm">
                        {totalPedCostela}
                      </td>
                      <td className="px-2.5 py-2.5 text-center border-r border-slate-300 bg-teal-100/80 text-teal-950 font-black text-sm">
                        {totalBandasPedidas}
                      </td>
                      <td className="px-3 py-2.5 text-right border-r border-slate-300 font-black text-slate-900">
                        {formatNumberBR(totalWeightKg, 0)} kg
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-emerald-800 text-sm">
                        {formatCurrencyBRL(totalCostR$)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. Observações operacionais */}
            {notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
                <span className="font-bold text-amber-900 block mb-0.5">Observações Operacionais:</span>
                <p className="text-slate-700 text-[11px] leading-relaxed">{notes}</p>
              </div>
            )}

            {/* 6. Assinaturas e Validação */}
            <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="border-t border-slate-900 pt-2">
                <span className="font-bold text-slate-900 block text-[11px]">Patrick Pessoa</span>
                <span className="text-[10px] text-slate-600 block">Comprador / Direção Geral GRUPO GAPP</span>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <span className="font-bold text-slate-900 block text-[11px]">Gerência de Logística & Câmaras</span>
                <span className="text-[10px] text-slate-600 block">Conferência & Recebimento (16 Lojas)</span>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <span className="font-bold text-slate-900 block text-[11px]">{supplierDetails?.name || supplierName}</span>
                <span className="text-[10px] text-slate-600 block">Aceite & Expedição Frigorífica</span>
              </div>
            </div>

            {/* Rodapé institucional */}
            <div className="text-center pt-2 border-t border-slate-200 text-[9px] text-slate-400">
              Grupo GAPP Sistemas • Sistema de Apuração e Compra do Boi • Documento gerado eletronicamente em {todayStr} às {new Date().toLocaleTimeString('pt-BR')}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
