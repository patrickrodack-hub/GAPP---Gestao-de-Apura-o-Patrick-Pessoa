import React, { useState } from 'react';
import { SheetRowData, Store } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR, calculateSheetTotals } from '../../services/calculationService';
import { PrintEngineService } from '../../services/printEngineService';
import { PdfReportService } from '../../services/pdfReportService';
import { WhatsAppShareService } from '../../services/whatsAppShareService';
import { StorageService } from '../../services/storageService';
import { ExcelExportService } from '../../services/excelExportService';
import { 
  Printer, 
  X, 
  Beef, 
  FileDown, 
  Download,
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Building2, 
  MessageCircle,
  TrendingUp,
  Boxes,
  Layers
} from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  stores: Store[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  rows,
  stores,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [xlsxSuccess, setXlsxSuccess] = useState(false);

  if (!isOpen) return null;

  const totals = calculateSheetTotals(rows);
  const yieldParams = StorageService.getYieldParams();
  const sessionUser = StorageService.getSessionUser();

  // Quantidades de Bovino
  const totalBoisPedidos = rows.reduce((acc, r) => acc + (r.pedidoFinal || 0), 0);
  const totalBoisCalc = Math.round(totals.boi || rows.reduce((acc, r) => acc + (r.boi || 0), 0));
  const totalPecasCortes = totals.pedidoDianteiro + totals.pedidoTraseiro + totals.pedidoCoxao + totals.pedidoAlcatrao + totals.pedidoCostelaGaucha;
  const totalPedAlcatrao = totals.pedidoAlcatraoReal || rows.reduce((acc, r) => acc + (r.pedidoAlcatraoReal || 0), 0);
  const totalPedCostela = totals.pedidoCostelaReal || rows.reduce((acc, r) => acc + (r.pedidoCostelaReal || 0), 0);
  const totalVendaBoi = totals.venda || totals.boiAVenda || 0;
  const totalSugestaoBoi = Math.round(totals.sugestaoPedido || 0);

  // Quantidades de Suíno
  const totalSuinoBanda = totals.bandaPecas || rows.reduce((acc, r) => acc + (r.bandaPecas || 0), 0);
  const totalPernil = totals.pernilPecas || rows.reduce((acc, r) => acc + (r.pernilPecas || 0), 0);
  const totalCostelaSuina = totals.costelaSuinaPecas || rows.reduce((acc, r) => acc + (r.costelaSuinaPecas || 0), 0);
  const totalVendaSuino = totals.bandaVenda || totals.vendaSuino || rows.reduce((acc, r) => acc + (r.bandaVenda || r.vendaSuino || 0), 0);
  const totalPedidoSuino = totals.bandaPedido || totals.pedidoSuino || rows.reduce((acc, r) => acc + (r.bandaPedido || r.pedidoSuino || 0), 0);

  // Estimativas Financeiras
  const boiCarcassWeight = yieldParams.carcassWeight || 240;
  const boiCostPerKg = yieldParams.costPerKg || 26.0;
  const estimatedBoiWeightKg = (totalBoisPedidos > 0 ? totalBoisPedidos : totalBoisCalc) * boiCarcassWeight;
  const estimatedBoiTotalR$ = estimatedBoiWeightKg * boiCostPerKg;

  const bandaCostPerKg = yieldParams.bandaCostKg || 26.0;
  const estimatedSuinoWeightKg = totalPedidoSuino * 36;
  const estimatedSuinoTotalR$ = estimatedSuinoWeightKg * bandaCostPerKg;
  const estimatedGrandTotalR$ = estimatedBoiTotalR$ + estimatedSuinoTotalR$;

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

  const handlePrint = () => {
    const params = StorageService.getYieldParams();
    const printHtml = PrintEngineService.generateSheetReportHtml({
      rows,
      stores,
      yieldBasis: params.basis || 'carcass',
      title: 'Relatório Oficial de Pedido (Bovino & Suíno) • Base Planilha de Compras',
    });

    PrintEngineService.printDocument(printHtml, {
      documentTitle: 'Relatorio_Pedido_Boi_Suino_GrupoGAPP',
      landscape: true,
    });
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await PdfReportService.generateAndDownloadReport({
        rows,
        stores,
        title: 'ERP APURAÇÃO DO BOI • RELATÓRIO DE PEDIDO (BOVINO & SUÍNO)',
        emissionDate: new Date(),
        currentUser: sessionUser?.name || 'Patrick Pessoa (Direção de Carnes)'
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (e) {
      console.error('Erro ao gerar relatório em PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = async () => {
    setIsSharingWhatsApp(true);
    setWhatsappSuccess(false);
    try {
      await WhatsAppShareService.shareExecutiveReportViaWhatsApp({
        rows,
        stores,
        title: 'Relatório Oficial de Pedido de Compras (Bovino & Suíno)',
        emissionDate: new Date(),
        currentUser: sessionUser?.name || 'Patrick Pessoa (Direção de Carnes)'
      });
      setWhatsappSuccess(true);
      setTimeout(() => setWhatsappSuccess(false), 3500);
    } catch (e) {
      console.error('Erro ao compartilhar relatório via WhatsApp:', e);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingXlsx(true);
    setXlsxSuccess(false);
    try {
      await ExcelExportService.exportExecutiveReportToXLSX(rows, stores);
      setXlsxSuccess(true);
      setTimeout(() => setXlsxSuccess(false), 3500);
    } catch (e) {
      console.error('Erro ao exportar relatório para Excel:', e);
    } finally {
      setIsExportingXlsx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-[98vw] w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-200 max-h-[96vh] flex flex-col">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3 border-b border-slate-200 gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-700 shrink-0">
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Relatório Oficial de Pedido de Compras • Apuração do Boi & Suíno
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Colunas Oficiais da Planilha
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  Bovino + Suíno Integrados
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Visualização executiva consolidada: Dianteiro, Traseiro, Coxão, Alcatrão, Pedido de Alcatrão, Costela G, Pedido de Costela G, Boi Calc, Venda, Sujestão, Pedido do Boi, Suíno, Pernil, Costela Suína, Venda de Suíno e Pedido de Suíno.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap justify-end">
            {/* Botão Exportar Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isExportingXlsx}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 active:scale-95 disabled:opacity-75 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              title="Baixar a planilha oficial em Excel (.xlsx) com as colunas selecionadas"
            >
              {isExportingXlsx ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando .xlsx...</span>
                </>
              ) : xlsxSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>Excel Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar .XLSX</span>
                </>
              )}
            </button>

            {/* Botão Gerar Relatório em PDF Direto */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-75 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              title="Gerar e baixar arquivo PDF oficial com todas as colunas de Bovino e Suíno em A4 Paisagem"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>PDF Baixado!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Gerar Relatório em PDF</span>
                </>
              )}
            </button>

            {/* Compartilhar por WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharingWhatsApp}
              className={`px-3 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-75 ${
                whatsappSuccess ? 'bg-teal-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
              title="Enviar espelho e PDF do relatório de pedido diretamente por WhatsApp"
            >
              {isSharingWhatsApp ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Preparando...</span>
                </>
              ) : whatsappSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enviado!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </>
              )}
            </button>

            {/* Botão Imprimir / Salvar PDF do Navegador */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Imprimir ou salvar via diálogo nativo do navegador em A4 Paisagem"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Fechar janela (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body com Scroll Interno */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          
          {/* Header Corporativo com Logotipos do Grupo GAPP e Data de Emissão */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#1b2d1e] via-[#101912] to-[#0a100c] border-2 border-emerald-500/50 p-1.5 flex items-center justify-center shadow-md shrink-0">
                <img 
                  src="/brand-logo.svg" 
                  alt="Grupo GAPP - Patrick Pessoa" 
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    e.currentTarget.src = '/patrick-pessoa-brand.png';
                  }}
                />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-mono block">
                  Grupo GAPP Sistemas • Por Patrick Pessoa
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  ERP APURAÇÃO DO BOI • RELATÓRIO GERAL DE PEDIDOS
                </h1>
                <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>BASE: PLANILHA DE COMPRAS DA DIREÇÃO v10.8</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">16 Filiais Consolidadas</span>
                  <span>•</span>
                  <span className="text-indigo-700 font-bold">Bovino & Suíno</span>
                </p>
              </div>
            </div>

            {/* Caixa com Data de Emissão e Totais */}
            <div className="text-left sm:text-right bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 sm:justify-end text-[10px] font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Emissão Oficial:</span>
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-0.5">
                {emissionDateFormatted} às {emissionTimeFormatted}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Previsto Compra</span>
                <span className="text-base font-black text-emerald-800 font-mono">
                  {formatCurrencyBRL(estimatedGrandTotalR$)}
                </span>
              </div>
            </div>
          </div>

          {/* Highlights / KPIs Resumidos em 5 Colunas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-blue-700 block flex items-center gap-1">
                <Beef className="w-3.5 h-3.5" />
                Pedido do Boi
              </span>
              <strong className="text-base font-mono text-blue-950 font-black">
                {totalBoisPedidos} <span className="text-xs font-normal text-slate-500">cabeças</span>
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Boi Calc: {Math.round(totalBoisCalc)} bois
              </span>
            </div>

            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-teal-700 block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Pedido Suíno (Bandas)
              </span>
              <strong className="text-base font-mono text-teal-950 font-black">
                {totalPedidoSuino} <span className="text-xs font-normal text-slate-500">bandas</span>
              </strong>
              <span className="text-[10px] text-teal-700 block mt-0.5 font-medium">
                Câmara: {totalSuinoBanda} | Venda: {totalVendaSuino}
              </span>
            </div>

            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-purple-700 block flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5" />
                Pedidos de Cortes
              </span>
              <strong className="text-base font-mono text-purple-950 font-black">
                {totalPedAlcatrao + totalPedCostela} <span className="text-xs font-normal text-slate-500">peças</span>
              </strong>
              <span className="text-[10px] text-purple-700 block mt-0.5 font-medium">
                Ped. Alcatrão: {totalPedAlcatrao} | Costela: {totalPedCostela}
              </span>
            </div>

            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-amber-700 block flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Giro / Venda Projetada
              </span>
              <strong className="text-base font-mono text-amber-950 font-black">
                {totalVendaBoi} <span className="text-xs font-normal text-slate-500">bois</span>
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Suíno Venda: {totalVendaSuino} pçs
              </span>
            </div>

            <div className="p-2 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Valor Total Compra
              </span>
              <strong className="text-base font-mono text-emerald-900 font-black">
                {formatCurrencyBRL(estimatedGrandTotalR$)}
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Boi: {formatCurrencyBRL(estimatedBoiTotalR$)} • Suíno: {formatCurrencyBRL(estimatedSuinoTotalR$)}
              </span>
            </div>
          </div>

          {/* Store Breakdown - Table strictly following requested columns */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Demonstrativo Oficial de Pedidos por Filial (16 Lojas)</span>
              </h4>
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                17 Colunas • Bovino & Suíno Integrados
              </span>
            </div>
            
            <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs">
              <table className="w-full text-xs text-left border-collapse font-mono select-none">
                <thead>
                  {/* Tier 1 Header: Group Headers */}
                  <tr className="uppercase text-[9.5px] font-black text-center">
                    <th rowSpan={2} className="border border-slate-300 p-2.5 text-left bg-slate-200 text-slate-900 min-w-[130px] font-sans sticky left-0 z-10">
                      FILIAL (16)
                    </th>
                    <th colSpan={7} className="border border-slate-300 py-1.5 px-2 bg-blue-100 text-blue-900 font-extrabold tracking-wide">
                      DADOS PARA GERAÇÃO DE PEDIDO (BOVINO)
                    </th>
                    <th colSpan={4} className="border border-slate-300 py-1.5 px-2 bg-indigo-100 text-indigo-900 font-extrabold tracking-wide">
                      APURAÇÃO & PEDIDO DO BOI
                    </th>
                    <th colSpan={5} className="border border-slate-300 py-1.5 px-2 bg-teal-100 text-teal-900 font-extrabold tracking-wide">
                      CÂMARA / BALCÃO & PEDIDO (SUÍNO)
                    </th>
                  </tr>

                  {/* Tier 2 Header: Individual Columns */}
                  <tr className="uppercase text-[9px] font-bold text-center">
                    {/* Bovino Pedido */}
                    <th className="border border-slate-300 py-1 px-1.5 bg-blue-50 text-blue-950">
                      DIANTEIRO
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-blue-50 text-blue-950">
                      TRASEIRO
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-blue-50 text-blue-950">
                      COXAO
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-blue-50 text-blue-950">
                      ALCATRAO
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-purple-100 text-purple-950 font-black whitespace-nowrap" title="PEDIDO DE ALCATRÃO (Peças pedidas)">
                      <span className="block leading-none text-[7.5px] text-purple-700 font-bold">PEDIDO DE</span>
                      <span className="block leading-tight font-black">ALCATRÃO</span>
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-blue-50 text-blue-950 font-bold">
                      COSTELA G
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-purple-100 text-purple-950 font-black whitespace-nowrap" title="PEDIDO DE COSTELA G (Peças pedidas)">
                      <span className="block leading-none text-[7.5px] text-purple-700 font-bold">PEDIDO DE</span>
                      <span className="block leading-tight font-black">COSTELA G</span>
                    </th>

                    {/* Apuração Boi */}
                    <th className="border border-slate-300 py-1 px-1.5 bg-sky-100 text-sky-950 font-black" title="Fórmula: (Dianteiro + Traseiro + Coxão + Alcatrão) / 2">
                      BOI CALC
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-amber-100 text-amber-950 font-black">
                      VENDA
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-purple-100 text-purple-950 font-black" title="Fórmula: Venda - Boi Calc">
                      SUJESTAO
                    </th>
                    <th className="border border-slate-300 py-1 px-2 bg-emerald-100 text-emerald-950 font-black" title="Quantidade efetiva pedida de bois">
                      PEDIDO DO BOI
                    </th>

                    {/* Suíno */}
                    <th className="border border-slate-300 py-1 px-1.5 bg-teal-50 text-teal-950 font-bold" title="Banda Suína em estoque / câmara">
                      SUÍNO
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-teal-50 text-teal-950 font-bold">
                      PERNIL
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-teal-50 text-teal-950 font-bold whitespace-nowrap">
                      COSTELA SUÍNA
                    </th>
                    <th className="border border-slate-300 py-1 px-1.5 bg-amber-50 text-amber-950 font-bold whitespace-nowrap">
                      VENDA DE SUÍNO
                    </th>
                    <th className="border border-slate-300 py-1 px-2 bg-teal-200 text-teal-950 font-black whitespace-nowrap" title="Quantidade pedida de bandas suínas">
                      <span className="block leading-none text-[7.5px] text-teal-800 font-bold">PEDIDO DE</span>
                      <span className="block leading-tight font-black">SUÍNO</span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 text-[10.5px]">
                  {rows.map((r, idx) => {
                    const boiCalc = Math.round(r.boi !== undefined ? r.boi : ((r.pedidoDianteiro + r.pedidoTraseiro + r.pedidoCoxao + r.pedidoAlcatrao) / 2));
                    const vendaVal = Math.round(r.venda || r.boiAVenda || 0);
                    const sujestaoVal = Math.round(r.sugestaoPedido !== undefined ? r.sugestaoPedido : (vendaVal - boiCalc));
                    const pedidoBoiVal = r.pedidoFinal !== undefined ? r.pedidoFinal : 0;

                    const pedAlcatraoVal = r.pedidoAlcatraoReal || 0;
                    const pedCostelaVal = r.pedidoCostelaReal || 0;
                    const suinoBandaVal = r.bandaPecas || 0;
                    const pernilVal = r.pernilPecas || 0;
                    const costelaSuinaVal = r.costelaSuinaPecas || 0;
                    const vendaSuinoVal = r.bandaVenda || r.vendaSuino || 0;
                    const pedidoSuinoVal = r.bandaPedido || r.pedidoSuino || 0;

                    return (
                      <tr 
                        key={r.storeId} 
                        className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 hover:bg-slate-100/70'}
                      >
                        {/* Filial */}
                        <td className="border border-slate-300 px-2.5 py-1.5 font-sans font-bold text-slate-900 whitespace-nowrap sticky left-0 z-10 bg-inherit">
                          {r.storeName}
                        </td>

                        {/* Bovino Pedido */}
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-800">
                          {r.pedidoDianteiro}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-800">
                          {r.pedidoTraseiro}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-800">
                          {r.pedidoCoxao}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-800">
                          {r.pedidoAlcatrao}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-purple-900 bg-purple-50/70">
                          {pedAlcatraoVal}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-800">
                          {r.pedidoCostelaGaucha}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-purple-900 bg-purple-50/70">
                          {pedCostelaVal}
                        </td>

                        {/* Apuração Boi */}
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-blue-900 bg-blue-50/50">
                          {boiCalc}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-amber-700 bg-amber-50/50">
                          {vendaVal}
                        </td>
                        <td className={`border border-slate-300 px-1.5 py-1.5 text-center font-bold bg-purple-50/40 ${
                          sujestaoVal < 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {sujestaoVal}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-black text-emerald-900 bg-emerald-50 text-xs">
                          {pedidoBoiVal}
                        </td>

                        {/* Suíno */}
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-teal-800 bg-teal-50/40">
                          {suinoBandaVal}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-700">
                          {pernilVal}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center text-slate-700">
                          {costelaSuinaVal}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-1.5 text-center font-bold text-amber-700 bg-amber-50/40">
                          {vendaSuinoVal}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-black text-teal-950 bg-teal-100 text-xs">
                          {pedidoSuinoVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-slate-200 text-slate-900 font-black font-mono text-[10.5px] border-t-2 border-slate-400">
                  <tr>
                    <td className="border border-slate-300 px-2.5 py-2 font-sans font-black text-[10px] sticky left-0 z-10 bg-slate-200">
                      TOTAL GERAL CONSOLIDADO
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center">
                      {totals.pedidoDianteiro}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center">
                      {totals.pedidoTraseiro}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center">
                      {totals.pedidoCoxao}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center">
                      {totals.pedidoAlcatrao}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center text-purple-900 bg-purple-100 font-bold">
                      {totalPedAlcatrao}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center">
                      {totals.pedidoCostelaGaucha}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center text-purple-900 bg-purple-100 font-bold">
                      {totalPedCostela}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center text-blue-900 bg-blue-100 font-black">
                      {Math.round(totals.boi || 0)}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center text-amber-900 bg-amber-100 font-black">
                      {totals.venda || totals.boiAVenda || 0}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center text-emerald-800 bg-purple-100 font-black">
                      {Math.round(totals.sugestaoPedido || 0)}
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-center text-emerald-950 bg-emerald-200 font-black text-xs">
                      {totalBoisPedidos}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center text-teal-900 bg-teal-100 font-bold">
                      {totalSuinoBanda}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center">
                      {totalPernil}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center">
                      {totalCostelaSuina}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-2 text-center text-amber-900 bg-amber-100 font-bold">
                      {totalVendaSuino}
                    </td>
                    <td className="border border-slate-300 px-2 py-2 text-center text-teal-950 bg-teal-300 font-black text-xs">
                      {totalPedidoSuino}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Signatures & Conformidade Corporativa */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1" />
              <strong className="block text-slate-800 text-[11px]">Diretoria Operacional</strong>
              <span className="text-[10px] text-slate-500">Grupo GAPP Sistemas</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1" />
              <strong className="block text-slate-800 text-[11px]">Gerência de Carnes & Desossa</strong>
              <span className="text-[10px] text-slate-500">Patrick Pessoa</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-1" />
              <strong className="block text-slate-800 text-[11px]">Controladoria & Matriz</strong>
              <span className="text-[10px] text-slate-500">Auditoria Oficial</span>
            </div>
          </div>

          {/* Rodapé Informativo */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono gap-1">
            <span>Grupo GAPP Sistemas • Patrick Pessoa • ERP Apuração do Boi v10.8 • 16 Lojas Consolidadas</span>
            <span className="flex items-center gap-1 text-emerald-700 font-sans font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Relatório Oficial Gerado em {emissionDateFormatted}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
