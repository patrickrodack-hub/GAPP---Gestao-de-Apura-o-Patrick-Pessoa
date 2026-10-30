import React, { useState } from 'react';
import { PrimaryDesmembramentoMesa, YieldAnalysisCuts } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR, kgToArroba } from '../../services/calculationService';
import { PdfReportService, GenerateBeefYieldPdfOptions } from '../../services/pdfReportService';
import { WhatsAppShareService } from '../../services/whatsAppShareService';
import { PrintEngineService } from '../../services/printEngineService';
import { StorageService } from '../../services/storageService';
import { 
  X, 
  Printer, 
  Download, 
  MessageCircle, 
  CheckCircle2, 
  Boxes, 
  Scissors, 
  Scale, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Clock, 
  ShieldCheck,
  Flame,
  Bone
} from 'lucide-react';

interface YieldReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  carcassWeight: number;
  costPerKg: number;
  breakagePercent: number;
  costFormationMode: string;
  targetMargin: number;
  selectedBatchName?: string;
  realYield: {
    effectiveCleanMeatCostPerKg: number;
    baseCleanMeatCostPerKg: number;
    netCleanMeatCostPerKg: number;
    cleanMeatYieldPercent: number;
    breakagePercent: number;
    totalCleanMeatKg: number;
    totalWasteKg: number;
    totalCost: number;
    totalRevenue: number;
    grossProfit: number;
    globalMarginSalePercent: number;
    globalMarginCostPercent: number;
    wasteRevenue: number;
    graxariaDiscountPerKg: number;
    primaryMesas: PrimaryDesmembramentoMesa[];
    cuts: YieldAnalysisCuts[];
  };
  presetProfitableMode?: string;
  mesaProfitMargins?: Record<string, number>;
}

export const YieldReportModal: React.FC<YieldReportModalProps> = ({
  isOpen,
  onClose,
  carcassWeight,
  costPerKg,
  breakagePercent,
  costFormationMode,
  targetMargin,
  selectedBatchName,
  realYield,
  presetProfitableMode = 'PADRAO',
  mesaProfitMargins = {}
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);

  if (!isOpen) return null;

  const sessionUser = StorageService.getSessionUser();
  const arrobaPrice = kgToArroba(costPerKg);

  const now = new Date();
  const emissionDateFormatted = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const emissionTimeFormatted = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Prepara payload de opções para o relatório PDF oficial
  const reportPdfOptions: GenerateBeefYieldPdfOptions = {
    title: 'RELATÓRIO TÉCNICO & EXECUTIVO DE RENDIMENTO E DESOSSA BOVINA',
    emissionDate: now,
    currentUser: sessionUser?.name || 'Patrick Pessoa (Direção de Carnes)',
    carcassWeight,
    costPerKg,
    arrobaPrice,
    breakagePercent: realYield.breakagePercent,
    cleanMeatYieldPercent: realYield.cleanMeatYieldPercent,
    effectiveCleanMeatCostPerKg: realYield.effectiveCleanMeatCostPerKg,
    costFormationMode,
    totalRevenue: realYield.totalRevenue,
    grossProfit: realYield.grossProfit,
    globalMarginSalePercent: realYield.globalMarginSalePercent,
    globalMarginCostPercent: realYield.globalMarginCostPercent,
    wasteRevenue: realYield.wasteRevenue,
    selectedBatchName,
    primaryMesas: realYield.primaryMesas.map(m => {
      const targetMarginPercent = mesaProfitMargins[m.code] ?? (m.marginOnSalePercent || 28);
      const targetSellingPriceKg = m.calculatedCostKg / (1 - targetMarginPercent / 100);
      return {
        alias: m.alias,
        code: m.code,
        name: m.name,
        carcassPercent: m.carcassPercent,
        marketCostFactor: m.marketCostFactor,
        calculatedCostKg: m.calculatedCostKg,
        weightKg: m.weightKg,
        sellingPriceKg: m.sellingPriceKg,
        targetSellingPriceKg: Number(targetSellingPriceKg.toFixed(2)),
        targetMarginPercent,
        averageDerivedPriceKg: m.averageDerivedPriceKg,
        derivedRevenueR$: m.derivedRevenueR$,
        marginOnCostPercent: Number((((targetSellingPriceKg - m.calculatedCostKg) / m.calculatedCostKg) * 100).toFixed(1)),
        marginOnSalePercent: targetMarginPercent,
        derivedCutNames: m.derivedCutNames
      };
    }),
    cuts: realYield.cuts
  };

  // 1. Download do PDF Oficial
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await PdfReportService.generateAndDownloadBeefYieldPdf(reportPdfOptions);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (e) {
      console.error('Erro ao gerar relatório de desossa em PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Compartilhar via WhatsApp
  const handleShareWhatsApp = async () => {
    setIsSharingWhatsApp(true);
    setWhatsappSuccess(false);
    try {
      await WhatsAppShareService.shareBeefYieldViaWhatsApp(reportPdfOptions);
      setWhatsappSuccess(true);
      setTimeout(() => setWhatsappSuccess(false), 3500);
    } catch (e) {
      console.error('Erro ao compartilhar relatório de desossa via WhatsApp:', e);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  // 3. Impressão direta do relatório formatado
  const handlePrint = () => {
    const printContent = document.getElementById('yield-report-printable-area');
    if (!printContent) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Relatorio_Tecnico_Desossa_${Math.round(carcassWeight)}kg</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; color: #0f172a; margin: 0; padding: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
            th { background-color: #113829; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 9px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .header-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #113829; padding-bottom: 8px; margin-bottom: 12px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 12px; }
            .kpi-card { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; background: #f8fafc; }
            .kpi-title { font-size: 8px; text-transform: uppercase; font-weight: bold; color: #64748b; }
            .kpi-value { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px; }
            .primary-row { background-color: #fef3c7; font-weight: bold; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    PrintEngineService.printDocument(html, {
      documentTitle: `Relatorio_Tecnico_Desossa_${Math.round(carcassWeight)}kg`,
      landscape: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* MODAL HEADER COM IDENTIDADE VISUAL OFICIAL GAPP */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#113829] to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <img 
              src="/patrick-pessoa-brand.png" 
              alt="Patrick Pessoa" 
              className="h-10 w-auto object-contain bg-white/95 rounded-lg p-1 shadow-sm"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  DOCUMENTO OFICIAL ERP
                </span>
                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {emissionDateFormatted} às {emissionTimeFormatted}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
                <span>Relatório Executivo & Técnico de Desossa Bovina</span>
                <span className="text-xs font-mono font-normal text-emerald-300">
                  ({carcassWeight} kg • R$ {costPerKg.toFixed(2)}/kg)
                </span>
              </h2>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer active:scale-95 shadow-xs"
              title="Imprimir relatório formatado em A4 Paisagem"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm disabled:opacity-50"
              title="Baixar PDF técnico vetorial em alta resolução"
            >
              {pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>PDF Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharingWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm disabled:opacity-50"
              title="Compartilhar resumo e documento no WhatsApp"
            >
              {whatsappSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-200" />
                  <span>Enviado!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>{isSharingWhatsApp ? 'Enviando...' : 'WhatsApp'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (PRINTABLE CONTENT AREA) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
          <div id="yield-report-printable-area" className="space-y-6">
            
            {/* 1. Header do Documento */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  GRUPO GAPP • DIREÇÃO DE CARNES & SUPRIMENTOS
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Apuração de Rendimento, Formação de Custos e Balanço de Desossa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Responsável: <strong>{sessionUser?.name || 'Patrick Pessoa (Direção de Carnes)'}</strong> • Modo de Formação: <strong>{costFormationMode === 'VAREJO_PADRAO' ? 'Padrão Varejo (Quebra Técnica 25%)' : 'Com Crédito Graxaria Auxiliar'}</strong>
                </p>
              </div>

              {selectedBatchName && (
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono">
                  <span className="text-[10px] text-slate-500 uppercase block">Lote Vinculado:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBatchName}</span>
                </div>
              )}
            </div>

            {/* 2. Strip de Indicadores Executivos (KPIs) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">PESO CARCAÇA</span>
                <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {formatNumberBR(carcassWeight, 1)} kg
                </div>
                <span className="text-[10px] text-amber-600 font-mono">{(carcassWeight / 15).toFixed(1)} @ carcaça</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">CUSTO COMPRA</span>
                <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatCurrencyBRL(costPerKg)}/kg
                </div>
                <span className="text-[10px] text-slate-500 font-mono">R$ {arrobaPrice.toFixed(2)}/@</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">CARNE LIMPA</span>
                <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                  {realYield.cleanMeatYieldPercent.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{formatNumberBR(realYield.totalCleanMeatKg, 1)} kg úteis</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">CUSTO LIMPO (VAREJO)</span>
                <div className="text-base font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatCurrencyBRL(realYield.effectiveCleanMeatCostPerKg)}/kg
                </div>
                <span className="text-[10px] text-rose-500 font-mono">Quebra: {realYield.breakagePercent.toFixed(1)}%</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">FATURAMENTO TOTAL</span>
                <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {formatCurrencyBRL(realYield.totalRevenue)}
                </div>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">Lucro: +{formatCurrencyBRL(realYield.grossProfit)}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">MARGEM GLOBAL</span>
                <div className="text-base font-black font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                  {realYield.globalMarginSalePercent}%
                </div>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-mono">Markup: +{realYield.globalMarginCostPercent}%</span>
              </div>
            </div>

            {/* 3. Tabela 1: Mesas de Desmembramento Primário (As 4 Peças Solicitadas) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-emerald-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    1. Mesas de Desmembramento Primário (Formação de Custo e Preço com Rentabilidade de Mercado)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-300">
                  Preset: {presetProfitableMode}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">Peça Primária</th>
                      <th className="px-3 py-2.5">Descrição Frigorífica</th>
                      <th className="px-3 py-2.5 text-right">% Carcaça</th>
                      <th className="px-3 py-2.5 text-right">Fator Mercado</th>
                      <th className="px-3 py-2.5 text-right">Custo Analítico (R$/kg)</th>
                      <th className="px-3 py-2.5 text-right">Peso (kg)</th>
                      <th className="px-3 py-2.5 text-right">Custo Total</th>
                      <th className="px-3 py-2.5 text-right">Margem %</th>
                      <th className="px-3 py-2.5 text-right">Markup %</th>
                      <th className="px-3 py-2.5 text-right">Preço Sugerido (R$/kg)</th>
                      <th className="px-3 py-2.5 text-right">Preço Praticado ERP</th>
                      <th className="px-3 py-2.5 text-right">Faturamento Projetado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                    {realYield.primaryMesas.map((mesa) => {
                      const targetMarg = mesaProfitMargins[mesa.code] ?? (mesa.marginOnSalePercent || 28);
                      const targetSellingPrice = mesa.calculatedCostKg / (1 - targetMarg / 100);
                      const markupCost = ((targetSellingPrice - mesa.calculatedCostKg) / mesa.calculatedCostKg) * 100;

                      return (
                        <tr key={mesa.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 font-sans font-bold text-slate-900 dark:text-white">
                            {mesa.alias}
                          </td>
                          <td className="px-3 py-2 font-sans text-slate-600 dark:text-slate-300">
                            {mesa.name}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-amber-700 dark:text-amber-400">
                            {mesa.carcassPercent.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                            {mesa.marketCostFactor.toFixed(3)}x
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrencyBRL(mesa.calculatedCostKg)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-200">
                            {mesa.weightKg.toFixed(1)} kg
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                            {formatCurrencyBRL(mesa.calculatedCostKg * mesa.weightKg)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-purple-600 dark:text-purple-400">
                            {targetMarg.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right text-purple-700 dark:text-purple-300">
                            +{markupCost.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                            {formatCurrencyBRL(targetSellingPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrencyBRL(mesa.sellingPriceKg)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrencyBRL(mesa.sellingPriceKg * mesa.weightKg)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Tabela 2: Detalhamento dos Cortes de Balcão e Rendimento */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    2. Detalhamento dos Cortes Comerciais e Subprodutos de Balcão
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {realYield.cuts.filter(c => !c.isPrimaryPiece).length} itens desossados
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5">Corte / Subproduto</th>
                      <th className="px-3 py-2.5">Mesa de Origem</th>
                      <th className="px-3 py-2.5 text-right">Rendimento %</th>
                      <th className="px-3 py-2.5 text-right">Peso Obtido (kg)</th>
                      <th className="px-3 py-2.5 text-right">Custo Equalizado</th>
                      <th className="px-3 py-2.5 text-right">Preço Venda (R$/kg)</th>
                      <th className="px-3 py-2.5 text-right">Faturamento Total</th>
                      <th className="px-3 py-2.5 text-right">Markup %</th>
                      <th className="px-3 py-2.5 text-right">Margem %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
                    {realYield.cuts.filter(c => !c.isPrimaryPiece).map((cut, idx) => (
                      <tr 
                        key={idx} 
                        className={cut.isWaste ? 'bg-rose-50/40 dark:bg-rose-950/10 text-slate-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                      >
                        <td className="px-3 py-2 font-sans font-medium text-slate-900 dark:text-slate-100">
                          {cut.name}
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-500">
                          {cut.parentMesaName ? cut.parentMesaName.replace('PEÇA ', '') : cut.category}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {cut.yieldPercent.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-800 dark:text-slate-200">
                          {cut.weightKg.toFixed(2)} kg
                        </td>
                        <td className="px-3 py-2 text-right">
                          {cut.isWaste ? 'Crédito Graxaria' : formatCurrencyBRL(cut.costPriceKg)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyBRL(cut.sellingPriceKg)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrencyBRL(cut.revenueR$)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {cut.isWaste ? '+100%' : `+${cut.marginOnCostPercent}%`}
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {cut.isWaste ? 'Graxaria' : `${cut.marginOnSalePercent}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Rodapé com Assinatura e Autenticação */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Autenticação ERP Grupo GAPP • Versão 10.8 • Cálculos em Conformidade Zootécnica e Contábil
                </span>
              </div>
              <div className="font-mono text-[11px]">
                Código do Documento: DESOSSA-GAPP-{Math.round(carcassWeight)}KG
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
