import React, { useState } from 'react';
import { SheetRowData, Store } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR, calculateSheetTotals } from '../../services/calculationService';
import { PrintEngineService } from '../../services/printEngineService';
import { PdfReportService } from '../../services/pdfReportService';
import { StorageService } from '../../services/storageService';
import { Printer, X, Beef, FileDown, CheckCircle2, ShieldCheck, Clock, Building2 } from 'lucide-react';

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

  if (!isOpen) return null;

  const totals = calculateSheetTotals(rows);
  const yieldParams = StorageService.getYieldParams();
  const sessionUser = StorageService.getSessionUser();

  const totalBois = totals.boi || rows.reduce((acc, r) => acc + (r.boi || 0), 0);
  const estimatedWeightKg = totalBois * (yieldParams.carcassWeight || 240);
  const estimatedTotalR$ = estimatedWeightKg * (yieldParams.costPerKg || 26.0);
  const totalPecas = totals.pedidoDianteiro + totals.pedidoTraseiro + totals.pedidoCoxao + totals.pedidoAlcatrao + totals.pedidoCostelaGaucha;
  const totalCamaraPecas = rows.reduce((acc, r) => acc + (r.camaraDianteiro || 0) + (r.somaDoTraseiro || 0) + (r.camaraCostelaGaucha || 0), 0);

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
      title: 'Relatório Gerencial de Apuração do Boi',
    });

    PrintEngineService.printDocument(printHtml, {
      documentTitle: 'Relatorio_Apuracao_Boi_GrupoGAPP',
      landscape: false,
    });
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await PdfReportService.generateAndDownloadReport({
        rows,
        stores,
        title: 'ERP APURAÇÃO DO BOI • RELATÓRIO EXECUTIVO MATRIZ',
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-slate-200">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Relatório Gerencial de Apuração do Boi
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Visualização oficial para exportação em PDF e impressão corporativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
            {/* Botão Gerar Relatório em PDF Direto */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-75 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Gerar e baixar arquivo PDF oficial com logotipos e data de emissão"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>PDF Baixado com Sucesso!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Gerar Relatório em PDF</span>
                </>
              )}
            </button>

            {/* Botão Imprimir / Salvar PDF do Navegador */}
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
              title="Imprimir ou salvar via diálogo de impressão do navegador"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body com Design Corporativo Elegante */}
        <div className="space-y-6 printable-content">
          
          {/* Header Corporativo com Logotipos do Grupo GAPP e Data de Emissão */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-5 gap-4">
            <div className="flex items-center gap-4">
              {/* Logotipo do Grupo GAPP */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#1b2d1e] via-[#101912] to-[#0a100c] border-2 border-emerald-500/50 p-2 flex items-center justify-center shadow-md shrink-0">
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
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 font-mono block">
                  Grupo GAPP Sistemas • Por Patrick Pessoa
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  ERP APURAÇÃO DO BOI
                </h1>
                <p className="text-xs text-slate-600 font-semibold flex items-center gap-2 mt-0.5">
                  <span>DIREÇÃO DA EMPRESA • PLANILHA MATRIZ v10.1</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">16 Filiais Integradas</span>
                </p>
              </div>
            </div>

            {/* Caixa com Data de Emissão e Totais */}
            <div className="text-left sm:text-right bg-slate-50 border border-slate-200 rounded-xl p-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 sm:justify-end text-[11px] font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Data de Emissão do Relatório:</span>
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-0.5">
                {emissionDateFormatted} às {emissionTimeFormatted}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Previsto do Lote</span>
                <span className="text-xl font-black text-emerald-800 font-mono">
                  {formatCurrencyBRL(estimatedTotalR$)}
                </span>
              </div>
            </div>
          </div>

          {/* Highlights / KPIs Resumidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Volume Total (Kg)</span>
              <strong className="text-base font-mono text-slate-900 font-extrabold">
                {formatNumberBR(estimatedWeightKg)} kg
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Base: {totalBois} bois calculados</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Peças Pedido</span>
              <strong className="text-base font-mono text-slate-900 font-extrabold">
                {formatNumberBR(totalPecas)} pç
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Diant. + Tras. + Cortes</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Preço Médio / Kg</span>
              <strong className="text-base font-mono text-blue-900 font-extrabold">
                {formatCurrencyBRL(yieldParams.costPerKg || 26.0)}/kg
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Base Carcaça {yieldParams.carcassWeight || 240}kg</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Estoque Câmaras Total</span>
              <strong className="text-base font-mono text-emerald-800 font-extrabold">
                {formatNumberBR(totalCamaraPecas)} pç
              </strong>
              <span className="text-[10px] text-slate-500 block mt-0.5">Inventário das 16 Lojas</span>
            </div>
          </div>

          {/* Store Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Demonstrativo Consolidado por Filial (16 Lojas)</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Ordenado por Filial • Matriz Central
              </span>
            </div>
            
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#004b87] text-white uppercase text-[9px] font-bold">
                  <tr>
                    <th className="border border-slate-300 p-2 text-left">Filial</th>
                    <th className="border border-slate-300 p-2 text-center">Ped. Diant.</th>
                    <th className="border border-slate-300 p-2 text-center">Ped. Tras.</th>
                    <th className="border border-slate-300 p-2 text-center">Ped. Coxão</th>
                    <th className="border border-slate-300 p-2 text-center">Ped. Alcat.</th>
                    <th className="border border-slate-300 p-2 text-center">Giro / Venda</th>
                    <th className="border border-slate-300 p-2 text-center">Boi (Fórmula)</th>
                    <th className="border border-slate-300 p-2 text-center">Sugestão</th>
                    <th className="border border-slate-300 p-2 text-center">Câm. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[10.5px]">
                  {rows.map((r, idx) => {
                    const camaraTotal = (r.camaraDianteiro || 0) + (r.somaDoTraseiro || 0) + (r.camaraCostelaGaucha || 0);
                    return (
                      <tr key={r.storeId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 p-2 font-sans font-semibold text-slate-900">
                          {r.storeName}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">{r.pedidoDianteiro}</td>
                        <td className="border border-slate-300 p-2 text-center">{r.pedidoTraseiro}</td>
                        <td className="border border-slate-300 p-2 text-center">{r.pedidoCoxao}</td>
                        <td className="border border-slate-300 p-2 text-center">{r.pedidoAlcatrao}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-amber-700">
                          {r.venda || r.boiAVenda || 0}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-800">
                          {r.boi || 0}
                        </td>
                        <td className={`border border-slate-300 p-2 text-center font-bold ${
                          (r.sugestaoPedido || 0) < 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {r.sugestaoPedido || 0}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">
                          {camaraTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-200 text-slate-900 font-black font-mono text-[11px]">
                  <tr>
                    <td className="border border-slate-300 p-2 font-sans">TOTAL GERAL CONSOLIDADO</td>
                    <td className="border border-slate-300 p-2 text-center">{totals.pedidoDianteiro}</td>
                    <td className="border border-slate-300 p-2 text-center">{totals.pedidoTraseiro}</td>
                    <td className="border border-slate-300 p-2 text-center">{totals.pedidoCoxao}</td>
                    <td className="border border-slate-300 p-2 text-center">{totals.pedidoAlcatrao}</td>
                    <td className="border border-slate-300 p-2 text-center text-amber-800">{totals.venda || totals.boiAVenda || 0}</td>
                    <td className="border border-slate-300 p-2 text-center">{totals.boi || 0}</td>
                    <td className="border border-slate-300 p-2 text-center text-emerald-800">{totals.sugestaoPedido || 0}</td>
                    <td className="border border-slate-300 p-2 text-center">{totalCamaraPecas}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Signatures & Conformidade Corporativa */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-2" />
              <strong className="block text-slate-800">Diretoria Operacional</strong>
              <span className="text-[11px] text-slate-500">Grupo GAPP Sistemas</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-2" />
              <strong className="block text-slate-800">Gerência de Carnes & Desossa</strong>
              <span className="text-[11px] text-slate-500">Patrick Pessoa</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-44 mx-auto mb-2" />
              <strong className="block text-slate-800">Controladoria & Matriz</strong>
              <span className="text-[11px] text-slate-500">Auditoria Oficial</span>
            </div>
          </div>

          {/* Rodapé Informativo */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-mono gap-1">
            <span>Grupo GAPP • Patrick Pessoa • ERP Apuração do Boi v10.1 • Portal: www.gipp-site.vercel.app</span>
            <span className="flex items-center gap-1 text-emerald-700 font-sans font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Documento Oficial Emitido em {emissionDateFormatted}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
