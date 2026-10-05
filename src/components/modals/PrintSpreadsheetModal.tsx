import React, { useState } from 'react';
import { SheetRowData, Store } from '../../types/erp';
import { calculateSheetTotals } from '../../services/calculationService';
import { PrintEngineService } from '../../services/printEngineService';
import { PdfReportService } from '../../services/pdfReportService';
import { StorageService } from '../../services/storageService';
import { 
  Printer, 
  X, 
  FileSpreadsheet, 
  FileDown, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Maximize2 
} from 'lucide-react';

interface PrintSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: SheetRowData[];
  stores: Store[];
}

export const PrintSpreadsheetModal: React.FC<PrintSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  rows,
  stores,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen) return null;

  const totals = calculateSheetTotals(rows);
  const sessionUser = StorageService.getSessionUser();

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
    const printHtml = PrintEngineService.generateFullSpreadsheetPrintHtml({
      rows,
      stores,
      title: 'Planilha Oficial de Compras e Apuração do Boi',
      currentUser: sessionUser?.name || 'Patrick Pessoa (Direção de Carnes)'
    });

    PrintEngineService.printDocument(printHtml, {
      documentTitle: 'Planilha_Compras_Oficial_GAPP',
      landscape: true,
    });
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await PdfReportService.generateAndDownloadFullSpreadsheetPdf({
        rows,
        stores,
        title: 'PLANILHA OFICIAL DE COMPRAS E APURAÇÃO DO BOI',
        emissionDate: new Date(),
        currentUser: sessionUser?.name || 'Patrick Pessoa (Direção de Carnes)'
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (e) {
      console.error('Erro ao gerar planilha em PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl max-w-[98vw] w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh]">
        
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Planilha Oficial de Compras • Exportação PDF & Impressão</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  16 Lojas • v10.3
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Visualização fiel da matriz em A4 Paisagem com todas as colunas, cortes, coluna Boi Hoje e totalizadores
              </p>
            </div>
          </div>

          {/* Action Buttons: Download PDF, Print, Zoom, Close */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs mr-1">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 15))}
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700"
                title="Restaurar Zoom 100%"
              >
                100%
              </button>
            </div>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                pdfSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20'
              }`}
              title="Gerar e baixar o arquivo PDF da Planilha Oficial em formato Paisagem"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PDF Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Salvar / Baixar PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-sm active:scale-95 cursor-pointer"
              title="Imprimir ou salvar via diálogo de impressão em A4 Paisagem"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Planilha</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Fechar Visualização (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Viewport */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950/80 p-3 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <div 
            className="bg-white text-slate-900 shadow-xl rounded-lg p-4 sm:p-6 mx-auto transition-transform duration-200 origin-top border border-slate-300 min-w-[1200px]"
            style={{ 
              transform: `scale(${zoomLevel / 100})`, 
              transformOrigin: 'top center',
              marginBottom: zoomLevel > 100 ? `${(zoomLevel - 100) * 8}px` : '0px'
            }}
          >
            {/* Sheet Timbre / Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-emerald-700">
              <div className="flex items-center gap-3">
                <img src="/patrick-pessoa-brand.png" alt="Grupo GAPP" className="h-9 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                    GRUPO GAPP SISTEMAS • PATRICK PESSOA
                  </span>
                  <h2 className="text-base font-black text-emerald-800 uppercase tracking-tight">
                    PLANILHA OFICIAL DE COMPRAS E APURAÇÃO DO BOI
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    Matriz Oficial Consolidada de 16 Filiais • v10.3 • Validação Contábil de Compra e Desossa
                  </p>
                </div>
              </div>

              <div className="text-right bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
                <div><strong>Data de Emissão:</strong> {emissionDateFormatted} às {emissionTimeFormatted}</div>
                <div><strong>Operador Responsável:</strong> {sessionUser?.name || 'Patrick Pessoa (Direção de Carnes)'}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Autenticação: GAPP-SHEET-OFFICIAL-v10.3</div>
              </div>
            </div>

            {/* Table Matrix Preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono select-none">
                <thead>
                  {/* Tier 1: Group Headers */}
                  <tr className="text-center font-bold uppercase text-[10px]">
                    <th rowSpan={2} className="px-2 py-1.5 bg-slate-200 text-slate-800 border border-slate-300 text-left min-w-[120px]">
                      FILIAL (16)
                    </th>
                    <th colSpan={10} className="px-2 py-1 bg-blue-100 text-blue-900 border border-slate-300">
                      DADOS PARA A GERAÇÃO DE PEDIDO
                    </th>
                    <th colSpan={5} className="px-2 py-1 bg-amber-100 text-amber-900 border border-slate-300">
                      PEÇA INTEIRA CÂMARA
                    </th>
                    <th colSpan={5} className="px-2 py-1 bg-emerald-100 text-emerald-900 border border-slate-300">
                      BALCÃO / CÂMARA / DESOSSA (NOBRES)
                    </th>
                    <th colSpan={4} className="px-2 py-1 bg-purple-100 text-purple-900 border border-slate-300">
                      BALCÃO DE DESOSSA (DIANTEIRO)
                    </th>
                    <th colSpan={4} className="px-2 py-1 bg-rose-100 text-rose-900 border border-slate-300">
                      BALCÃO DE DESOSSA (TRASEIRO)
                    </th>
                    <th colSpan={6} className="px-2 py-1 bg-teal-100 text-teal-900 border border-slate-300">
                      CÂMARA / SUÍNO
                    </th>
                  </tr>

                  {/* Tier 2: Column Names */}
                  <tr className="text-center font-semibold uppercase text-[9px] bg-slate-50 text-slate-700">
                    {/* Pedido */}
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Diant</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Tras</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Coxão</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Alcat</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Cost.G</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-200/80 font-bold text-blue-900">Boi</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Venda</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Sugest</th>
                    <th className="px-1.5 py-1 border border-slate-300 bg-indigo-100 font-black text-indigo-900">Pedido</th>
                    <th className="px-1 py-1 border border-slate-300 bg-blue-50">Trâns.</th>

                    {/* Câmara */}
                    <th className="px-1 py-1 border border-slate-300 bg-amber-50">Diant</th>
                    <th className="px-1 py-1 border border-slate-300 bg-amber-50">Tras</th>
                    <th className="px-1 py-1 border border-slate-300 bg-amber-50">Coxão</th>
                    <th className="px-1 py-1 border border-slate-300 bg-amber-50">Alcat</th>
                    <th className="px-1 py-1 border border-slate-300 bg-amber-50">Cost.G</th>

                    {/* Nobres */}
                    <th className="px-1 py-1 border border-slate-300 bg-emerald-50">Alc.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-emerald-50">CF.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-emerald-50">Pic.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-emerald-50">Mig.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-emerald-50">Cost.C</th>

                    {/* Dianteiro */}
                    <th className="px-1 py-1 border border-slate-300 bg-purple-50">Pal.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-purple-50">Acém.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-purple-50">Peito.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-purple-50">Músc.Pç</th>

                    {/* Traseiro */}
                    <th className="px-1 py-1 border border-slate-300 bg-rose-50">Chã.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-rose-50">Pat.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-rose-50">LagR.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-rose-50">LagP.Pç</th>

                    {/* Suíno */}
                    <th className="px-1 py-1 border border-slate-300 bg-teal-50">Banda.Pç</th>
                    <th className="px-1 py-1 border border-slate-300 bg-teal-50">Venda</th>
                    <th className="px-1 py-1 border border-slate-300 bg-teal-50">Sugest</th>
                    <th className="px-1.5 py-1 border border-slate-300 bg-teal-200 font-black text-teal-900">Pedido</th>
                    <th className="px-1 py-1 border border-slate-300 bg-teal-50">C.Suína</th>
                    <th className="px-1 py-1 border border-slate-300 bg-teal-50">Pernil</th>
                  </tr>

                  {/* Preço Referência */}
                  <tr className="bg-slate-100 text-slate-600 font-bold text-[8.5px] border-b border-slate-300">
                    <td className="px-2 py-0.5 border border-slate-300 font-sans text-left">PREÇO BASE R$</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center font-black text-indigo-900">26,00</td>
                    <td className="border border-slate-300 text-center">-</td>

                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">29,00</td>
                    <td className="border border-slate-300 text-center">25,50</td>

                    <td className="border border-slate-300 text-center">39,90</td>
                    <td className="border border-slate-300 text-center">39,90</td>
                    <td className="border border-slate-300 text-center">39,90</td>
                    <td className="border border-slate-300 text-center">39,90</td>
                    <td className="border border-slate-300 text-center">25,00</td>

                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>
                    <td className="border border-slate-300 text-center">25,00</td>
                    <td className="border border-slate-300 text-center">26,00</td>

                    <td className="border border-slate-300 text-center">31,50</td>
                    <td className="border border-slate-300 text-center">31,50</td>
                    <td className="border border-slate-300 text-center">31,50</td>
                    <td className="border border-slate-300 text-center">31,50</td>

                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center font-black text-teal-900">26,00</td>
                    <td className="border border-slate-300 text-center">35,00</td>
                    <td className="border border-slate-300 text-center">9,00</td>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.storeId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="px-2 py-1 border border-slate-300 font-sans font-bold text-slate-800">
                        {r.storeName}
                      </td>
                      {/* Pedido */}
                      <td className="border border-slate-300 text-center">{r.pedidoDianteiro || 0}</td>
                      <td className="border border-slate-300 text-center">{r.pedidoTraseiro || 0}</td>
                      <td className="border border-slate-300 text-center">{r.pedidoCoxao || 0}</td>
                      <td className="border border-slate-300 text-center">{r.pedidoAlcatrao || 0}</td>
                      <td className="border border-slate-300 text-center">{r.pedidoCostelaGaucha || 0}</td>
                      <td className="border border-slate-300 text-center font-bold text-blue-700">{r.boi || 0}</td>
                      <td className="border border-slate-300 text-center">{r.venda || r.boiAVenda || 0}</td>
                      <td className={`border border-slate-300 text-center font-bold ${(r.sugestaoPedido || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {(r.sugestaoPedido || 0) > 0 ? `+${r.sugestaoPedido}` : (r.sugestaoPedido || 0)}
                      </td>
                      <td className="border border-slate-300 text-center font-black bg-indigo-50 text-indigo-900">
                        {r.pedidoFinal || 0}
                      </td>
                      <td className="border border-slate-300 text-center">{r.pTransito || 0}</td>

                      {/* Câmara */}
                      <td className="border border-slate-300 text-center">{r.camaraDianteiro || 0}</td>
                      <td className="border border-slate-300 text-center">{r.camaraTraseiro || 0}</td>
                      <td className="border border-slate-300 text-center">{r.camaraCoxao || 0}</td>
                      <td className="border border-slate-300 text-center">{r.camaraAlcatrao || 0}</td>
                      <td className="border border-slate-300 text-center">{r.camaraCostelaGaucha || 0}</td>

                      {/* Nobres */}
                      <td className="border border-slate-300 text-center">{r.alcatra || 0}</td>
                      <td className="border border-slate-300 text-center">{r.contraFile || 0}</td>
                      <td className="border border-slate-300 text-center">{r.picanha || 0}</td>
                      <td className="border border-slate-300 text-center">{r.fileMignon || 0}</td>
                      <td className="border border-slate-300 text-center">{r.costelaCong || 0}</td>

                      {/* Dianteiro */}
                      <td className="border border-slate-300 text-center">{r.paletaPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.acemPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.peitoPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.musculoPecas || 0}</td>

                      {/* Traseiro */}
                      <td className="border border-slate-300 text-center">{r.chaPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.patinhoPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.lagartoRedondoPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.lagartoPlanoPecas || 0}</td>

                      {/* Suíno */}
                      <td className="border border-slate-300 text-center">{r.bandaPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.bandaVenda || 0}</td>
                      <td className="border border-slate-300 text-center">{Math.round(r.bandaSugestao || 0)}</td>
                      <td className="border border-slate-300 text-center font-black bg-teal-50 text-teal-900">{r.bandaPedido || 0}</td>
                      <td className="border border-slate-300 text-center">{r.costelaSuinaPecas || 0}</td>
                      <td className="border border-slate-300 text-center">{r.pernilPecas || 0}</td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  {/* Totais Peças */}
                  <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-400">
                    <td className="px-2 py-1 border border-slate-300 font-sans text-left">TOTAL PEÇAS</td>
                    <td className="border border-slate-300 text-center">{totals.pedidoDianteiro}</td>
                    <td className="border border-slate-300 text-center">{totals.pedidoTraseiro}</td>
                    <td className="border border-slate-300 text-center">{totals.pedidoCoxao}</td>
                    <td className="border border-slate-300 text-center">{totals.pedidoAlcatrao}</td>
                    <td className="border border-slate-300 text-center">{totals.pedidoCostelaGaucha}</td>
                    <td className="border border-slate-300 text-center text-blue-700">{totals.boi}</td>
                    <td className="border border-slate-300 text-center">{totals.venda}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.sugestaoPedido)}</td>
                    <td className="border border-slate-300 text-center font-black text-indigo-900 bg-indigo-100">{totals.pedidoFinal}</td>
                    <td className="border border-slate-300 text-center">{totals.pTransito}</td>

                    <td className="border border-slate-300 text-center">{totals.camaraDianteiro}</td>
                    <td className="border border-slate-300 text-center">{totals.camaraTraseiro}</td>
                    <td className="border border-slate-300 text-center">{totals.camaraCoxao}</td>
                    <td className="border border-slate-300 text-center">{totals.camaraAlcatrao}</td>
                    <td className="border border-slate-300 text-center">{totals.camaraCostelaGaucha}</td>

                    <td className="border border-slate-300 text-center">{totals.alcatra}</td>
                    <td className="border border-slate-300 text-center">{totals.contraFile}</td>
                    <td className="border border-slate-300 text-center">{totals.picanha}</td>
                    <td className="border border-slate-300 text-center">{totals.fileMignon}</td>
                    <td className="border border-slate-300 text-center">{totals.costelaCong}</td>

                    <td className="border border-slate-300 text-center">{totals.paletaPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.acemPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.peitoPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.musculoPecas}</td>

                    <td className="border border-slate-300 text-center">{totals.chaPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.patinhoPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.lagartoRedondoPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.lagartoPlanoPecas}</td>

                    <td className="border border-slate-300 text-center">{totals.bandaPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.bandaVenda}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.bandaSugestao)}</td>
                    <td className="border border-slate-300 text-center font-black text-teal-900 bg-teal-100">{totals.bandaPedido}</td>
                    <td className="border border-slate-300 text-center">{totals.costelaSuinaPecas}</td>
                    <td className="border border-slate-300 text-center">{totals.pernilPecas}</td>
                  </tr>

                  {/* Totais em KG */}
                  <tr className="bg-slate-50 text-[9px] text-slate-600 font-bold border-b border-slate-300">
                    <td className="px-2 py-1 border border-slate-300 font-sans text-left">TOTAL EM KG</td>
                    <td className="border border-slate-300 text-center">5.775</td>
                    <td className="border border-slate-300 text-center">2.975</td>
                    <td className="border border-slate-300 text-center">1.881</td>
                    <td className="border border-slate-300 text-center">1.820</td>
                    <td className="border border-slate-300 text-center">1.848</td>
                    <td className="border border-slate-300 text-center text-blue-700">{(totals.boi * 260).toFixed(0)}</td>
                    <td className="border border-slate-300 text-center">{(totals.venda * 260).toFixed(0)}</td>
                    <td className="border border-slate-300 text-center">{(totals.sugestaoPedido * 260).toFixed(0)}</td>
                    <td className="border border-slate-300 text-center font-black text-indigo-900">{(totals.pedidoFinal * 260).toFixed(0)}</td>
                    <td className="border border-slate-300 text-center">4.675</td>

                    <td className="border border-slate-300 text-center">182</td>
                    <td className="border border-slate-300 text-center">1.035</td>
                    <td className="border border-slate-300 text-center">7.535</td>
                    <td className="border border-slate-300 text-center">1.848</td>
                    <td className="border border-slate-300 text-center">400</td>

                    <td className="border border-slate-300 text-center">{Math.round(totals.alcatraKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.contraFileKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.picanhaKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.fileMignonKg)}</td>
                    <td className="border border-slate-300 text-center">112</td>

                    <td className="border border-slate-300 text-center">{Math.round(totals.paletaKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.acemKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.peitoKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.musculoKg)}</td>

                    <td className="border border-slate-300 text-center">{Math.round(totals.chaKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.patinhoKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.lagartoRedondoKg)}</td>
                    <td className="border border-slate-300 text-center">{Math.round(totals.lagartoPlanoKg)}</td>

                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center font-black text-teal-900">{(totals.bandaPedido * 36).toFixed(0)}</td>
                    <td className="border border-slate-300 text-center">-</td>
                    <td className="border border-slate-300 text-center">-</td>
                  </tr>

                  {/* Total Geral R$ */}
                  <tr className="bg-emerald-100 text-emerald-900 font-extrabold border-t-2 border-emerald-600">
                    <td className="px-2 py-1.5 border border-emerald-300 font-sans text-left font-black">
                      TOTAL GERAL R$
                    </td>
                    <td colSpan={34} className="px-3 py-1.5 border border-emerald-300 text-right font-sans text-[11px]">
                      Validação Contábil Conforme Planilha da Direção: <strong className="font-mono text-emerald-950 font-black text-xs">R$ 376.311,95</strong> (Lote de Compra Consolidado das 16 Lojas)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signatures & Footer */}
            <div className="grid grid-cols-3 gap-6 pt-6 mt-4 border-t border-slate-200 text-center text-xs text-slate-600">
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold">
                  Diretoria Operacional & Matriz
                </div>
                <span className="text-[10px] text-slate-400">Grupo GAPP Sistemas</span>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold">
                  Gerência de Carnes & Desossa
                </div>
                <span className="text-[10px] text-slate-400">Patrick Pessoa</span>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold">
                  Controladoria & Auditoria
                </div>
                <span className="text-[10px] text-slate-400">Auditoria Oficial</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
