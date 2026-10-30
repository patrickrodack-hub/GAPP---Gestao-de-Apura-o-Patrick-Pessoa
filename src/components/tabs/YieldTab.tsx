import React, { useState, useEffect, useMemo } from 'react';
import { 
  calculateRealBeefYield, 
  formatCurrencyBRL, 
  formatNumberBR, 
  arrobaToKg, 
  kgToArroba 
} from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { PurchaseBatch, Product, YieldParams, PrimaryDesmembramentoMesa } from '../../types/erp';
import { 
  Scissors, 
  Scale, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  Bone, 
  Flame, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Link2,
  Database,
  Layers,
  Edit3,
  RotateCcw,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  Check,
  Building2,
  Boxes,
  Split,
  Filter,
  HelpCircle,
  ArrowUpRight,
  FileText,
  Calculator,
  Percent,
  Printer,
  Download,
  FileDown
} from 'lucide-react';
import { BeefYieldDonutChart } from '../charts/BeefYieldDonutChart';
import { YieldReportModal } from '../modals/YieldReportModal';
import { PdfReportService, GenerateBeefYieldPdfOptions } from '../../services/pdfReportService';

interface YieldTabProps {
  yieldParams?: YieldParams;
  onSaveYieldParams?: (params: any) => void;
  latestBatch?: PurchaseBatch;
  products?: Product[];
  batches?: PurchaseBatch[];
  onUpdateProducts?: (products: Product[]) => void;
}

export const YieldTab: React.FC<YieldTabProps> = ({
  yieldParams,
  onSaveYieldParams,
  latestBatch,
  products,
  batches = [],
  onUpdateProducts
}) => {
  // Catálogo de produtos real da base de dados do ERP
  const realCatalog = useMemo(() => {
    return products && products.length > 0 ? products : StorageService.getProducts();
  }, [products]);

  // Lista de lotes reais da base de dados
  const realBatches = useMemo(() => {
    return batches && batches.length > 0 ? batches : StorageService.getBatches();
  }, [batches]);

  // Modo de origem dos dados: Base de Produtos do ERP ou Lote de Compra Real
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ERP_STANDARD');

  // Parâmetros de apuração técnica vinculados e persistidos na base de dados
  const [carcassWeight, setCarcassWeight] = useState<number>(() => {
    if (yieldParams?.carcassWeight) return yieldParams.carcassWeight;
    const p = StorageService.getYieldParams();
    return p.carcassWeight || 240;
  });
  const [costPerKg, setCostPerKg] = useState<number>(() => {
    if (yieldParams?.costPerKg) return yieldParams.costPerKg;
    const p = StorageService.getYieldParams();
    return p.costPerKg || 26.00;
  });
  const [fatPriceKg, setFatPriceKg] = useState<number>(() => {
    if (yieldParams?.fatPriceKg) return yieldParams.fatPriceKg;
    const p = StorageService.getYieldParams();
    return p.fatPriceKg || 4.85;
  });
  const [bonePriceKg, setBonePriceKg] = useState<number>(() => {
    if (yieldParams?.bonePriceKg) return yieldParams.bonePriceKg;
    const p = StorageService.getYieldParams();
    return p.bonePriceKg || 0.90;
  });
  const [targetMargin, setTargetMargin] = useState<number>(() => {
    if (yieldParams?.targetMargin) return yieldParams.targetMargin;
    const p = StorageService.getYieldParams();
    return p.targetMargin || 28;
  });

  // Quebra técnica da desossa (padrão varejo 25.0%, faixa de 20% a 30%)
  const [breakagePercent, setBreakagePercent] = useState<number>(() => {
    if (yieldParams?.breakagePercent) return yieldParams.breakagePercent;
    const p = StorageService.getYieldParams();
    return p.breakagePercent || 25.0;
  });

  // Modo de formação de custo: 'VAREJO_PADRAO' (formação direta pela quebra) ou 'COM_GRAXARIA_AUXILIAR'
  const [costFormationMode, setCostFormationMode] = useState<'VAREJO_PADRAO' | 'COM_GRAXARIA_AUXILIAR'>(() => {
    if (yieldParams?.costFormationMode) return yieldParams.costFormationMode;
    const p = StorageService.getYieldParams();
    return p.costFormationMode || 'VAREJO_PADRAO';
  });

  // Preços editáveis em tempo real para sincronização com o banco de dados
  const [customSellingPrices, setCustomSellingPrices] = useState<Record<string, number>>({});
  const [editingPriceCode, setEditingPriceCode] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [savedProductsSuccess, setSavedProductsSuccess] = useState<boolean>(false);

  // Estado do Modal de Relatório Executivo Oficial de Desossa
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Presets de rentabilidade de mercado para as peças primárias (Dianteiro, Traseiro, Coxão, Alcatrão)
  const [profitabilityPreset, setProfitabilityPreset] = useState<'COMPETITIVO' | 'PADRAO' | 'PREMIUM' | 'CUSTOM'>('PADRAO');

  // Margens de lucro desejadas sobre venda (%) para cada mesa primária
  const [mesaProfitMargins, setMesaProfitMargins] = useState<Record<string, number>>({
    'BOI-DIANT': 25.0,     // Dianteiro: 25% (giro comercial)
    'BOI-TRAS': 30.0,      // Traseiro: 30%
    'BOI-COXAO': 28.0,     // Coxão: 28%
    'BOI-ALCAT': 34.0,     // Alcatrão: 34% (cortes nobres de lombo)
    'BOI-COST-GAU': 22.0   // Ponta de Agulha / Costela: 22%
  });

  // Estado de geração do PDF Técnico com Rosca e Tabela de Preços
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Sincroniza dinamicamente se yieldParams mudar externamente
  useEffect(() => {
    if (yieldParams) {
      if (yieldParams.carcassWeight > 0) setCarcassWeight(yieldParams.carcassWeight);
      if (yieldParams.costPerKg > 0) setCostPerKg(yieldParams.costPerKg);
      if (yieldParams.fatPriceKg > 0) setFatPriceKg(yieldParams.fatPriceKg);
      if (yieldParams.bonePriceKg > 0) setBonePriceKg(yieldParams.bonePriceKg);
      if (yieldParams.targetMargin > 0) setTargetMargin(yieldParams.targetMargin);
      if (yieldParams.breakagePercent) setBreakagePercent(yieldParams.breakagePercent);
      if (yieldParams.costFormationMode) setCostFormationMode(yieldParams.costFormationMode);
    }
  }, [yieldParams]);

  // Monta catálogo efetivo aplicando customizações do usuário
  const effectiveCatalog = useMemo(() => {
    return realCatalog.map(p => {
      if (customSellingPrices[p.code] !== undefined) {
        return { ...p, sellingPriceKg: customSellingPrices[p.code] };
      }
      return p;
    });
  }, [realCatalog, customSellingPrices]);

  // Apuração REAL de rendimento e desossa com dados do ERP e quebra de varejo
  const realYield = useMemo(() => {
    return calculateRealBeefYield(
      carcassWeight,
      costPerKg,
      effectiveCatalog,
      fatPriceKg,
      bonePriceKg,
      targetMargin,
      breakagePercent,
      costFormationMode
    );
  }, [carcassWeight, costPerKg, effectiveCatalog, fatPriceKg, bonePriceKg, targetMargin, breakagePercent, costFormationMode]);

  // Filtro de exibição na tabela de cortes por Mesa de Desmembramento
  const [selectedMesaFilter, setSelectedMesaFilter] = useState<'ALL' | 'MESAS_ONLY' | 'BOI-ALCAT' | 'BOI-COXAO' | 'BOI-DIANT' | 'BOI-COST-GAU' | 'WASTE'>('ALL');
  const [isMesaGuideOpen, setIsMesaGuideOpen] = useState<boolean>(false);

  // Lista de cortes filtrados
  const displayedCuts = useMemo(() => {
    if (selectedMesaFilter === 'ALL') return realYield.cuts;
    if (selectedMesaFilter === 'MESAS_ONLY') return realYield.cuts.filter(c => c.isPrimaryPiece);
    if (selectedMesaFilter === 'WASTE') return realYield.cuts.filter(c => c.isWaste);
    return realYield.cuts.filter(c => 
      c.isPrimaryPiece 
        ? c.productCode === selectedMesaFilter 
        : c.parentMesaCode === selectedMesaFilter
    );
  }, [realYield.cuts, selectedMesaFilter]);

  const arrobaPrice = kgToArroba(costPerKg);

  const handleArrobaChange = (val: number) => {
    setCostPerKg(Number(arrobaToKg(val).toFixed(2)));
  };

  // Aplica dados de um lote real selecionado
  const handleSelectBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    if (batchId === 'ERP_STANDARD') {
      const p = StorageService.getYieldParams();
      setCarcassWeight(p.carcassWeight || 240);
      setCostPerKg(p.costPerKg || 26.00);
      return;
    }

    const found = realBatches.find(b => b.id === batchId);
    if (found) {
      if (found.costPerKg > 0) {
        setCostPerKg(found.costPerKg);
      } else if (found.arrobaPrice > 0) {
        setCostPerKg(Number((found.arrobaPrice / 15).toFixed(2)));
      }
      if (found.headsCount > 0 && found.totalGrossWeightKg > 0) {
        setCarcassWeight(Math.round(found.totalGrossWeightKg / found.headsCount));
      }
    }
  };

  const handlePriceChange = (code: string, newPrice: number) => {
    setCustomSellingPrices(prev => ({
      ...prev,
      [code]: newPrice
    }));
  };

  // Salva novos preços de venda diretamente na base de dados de produtos do ERP
  const handleSavePricesToDatabase = () => {
    const updatedProducts = realCatalog.map(p => {
      if (customSellingPrices[p.code] !== undefined) {
        return {
          ...p,
          sellingPriceKg: customSellingPrices[p.code],
          targetMarginPercent: p.defaultPriceKg > 0 
            ? Number((((customSellingPrices[p.code] - p.defaultPriceKg) / customSellingPrices[p.code]) * 100).toFixed(1))
            : p.targetMarginPercent
        };
      }
      return p;
    });

    StorageService.saveProducts(updatedProducts);
    if (onUpdateProducts) {
      onUpdateProducts(updatedProducts);
    }
    setSavedProductsSuccess(true);
    setEditingPriceCode(null);
    setTimeout(() => setSavedProductsSuccess(false), 3500);
  };

  // Alterna o preset de rentabilidade de mercado
  const handlePresetChange = (preset: 'COMPETITIVO' | 'PADRAO' | 'PREMIUM' | 'CUSTOM') => {
    setProfitabilityPreset(preset);
    if (preset === 'COMPETITIVO') {
      setMesaProfitMargins({
        'BOI-DIANT': 18.0,
        'BOI-TRAS': 24.0,
        'BOI-COXAO': 22.0,
        'BOI-ALCAT': 28.0,
        'BOI-COST-GAU': 16.0
      });
    } else if (preset === 'PADRAO') {
      setMesaProfitMargins({
        'BOI-DIANT': 25.0,
        'BOI-TRAS': 30.0,
        'BOI-COXAO': 28.0,
        'BOI-ALCAT': 34.0,
        'BOI-COST-GAU': 22.0
      });
    } else if (preset === 'PREMIUM') {
      setMesaProfitMargins({
        'BOI-DIANT': 30.0,
        'BOI-TRAS': 38.0,
        'BOI-COXAO': 34.0,
        'BOI-ALCAT': 42.0,
        'BOI-COST-GAU': 28.0
      });
    }
  };

  // Atualiza margem individual de uma mesa
  const handleMesaMarginChange = (mesaCode: string, newMargin: number) => {
    setProfitabilityPreset('CUSTOM');
    setMesaProfitMargins(prev => ({
      ...prev,
      [mesaCode]: Math.max(0, Math.min(80, newMargin))
    }));
  };

  // Aplica todos os preços calculados com rentabilidade de mercado ao catálogo do ERP
  const handleApplyAllSuggestedPrices = () => {
    const updatedPrices: Record<string, number> = { ...customSellingPrices };
    
    realYield.primaryMesas.forEach(m => {
      const marg = mesaProfitMargins[m.code] ?? 28;
      const suggestedPrice = Number((m.calculatedCostKg / (1 - marg / 100)).toFixed(2));
      updatedPrices[m.code] = suggestedPrice;
    });

    setCustomSellingPrices(updatedPrices);

    const updatedProducts = realCatalog.map(p => {
      if (updatedPrices[p.code] !== undefined) {
        return {
          ...p,
          sellingPriceKg: updatedPrices[p.code],
          targetMarginPercent: mesaProfitMargins[p.code] ?? p.targetMarginPercent
        };
      }
      return p;
    });

    StorageService.saveProducts(updatedProducts);
    if (onUpdateProducts) {
      onUpdateProducts(updatedProducts);
    }
    setSavedProductsSuccess(true);
    setTimeout(() => setSavedProductsSuccess(false), 3500);
  };

  // Aplica preço sugerido de uma mesa primária individual
  const handleApplySingleSuggestedPrice = (mesaCode: string, suggestedPrice: number) => {
    const updatedPrices = {
      ...customSellingPrices,
      [mesaCode]: suggestedPrice
    };
    setCustomSellingPrices(updatedPrices);

    const updatedProducts = realCatalog.map(p => {
      if (p.code === mesaCode) {
        return {
          ...p,
          sellingPriceKg: suggestedPrice,
          targetMarginPercent: mesaProfitMargins[mesaCode] ?? p.targetMarginPercent
        };
      }
      return p;
    });

    StorageService.saveProducts(updatedProducts);
    if (onUpdateProducts) {
      onUpdateProducts(updatedProducts);
    }
    setSavedProductsSuccess(true);
    setTimeout(() => setSavedProductsSuccess(false), 3500);
  };

  // Exporta diretamente o PDF Técnico com Gráfico de Rosca e Tabela de Preços Calculados
  const handleDownloadTechnicalPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      const sessionUser = StorageService.getSessionUser();
      const options: GenerateBeefYieldPdfOptions = {
        title: 'RELATÓRIO TÉCNICO DE RENDIMENTO, DESOSSA E MESAS PRIMÁRIAS',
        emissionDate: new Date(),
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
        selectedBatchName: selectedBatchInfo ? `Lote ${selectedBatchInfo.invoiceNumber} - ${selectedBatchInfo.supplier}` : 'Catálogo Oficial de Produtos (ERP)',
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

      await PdfReportService.generateAndDownloadBeefYieldPdf(options);
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3500);
    } catch (e) {
      console.error('Erro ao exportar PDF técnico da desossa:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Salva parâmetros técnicos no ERP
  const handleSaveToSettings = () => {
    const updated = {
      carcassWeight,
      costPerKg: Number(costPerKg.toFixed(2)),
      fatPriceKg: Number(fatPriceKg.toFixed(2)),
      bonePriceKg: Number(bonePriceKg.toFixed(2)),
      targetMargin: Number(targetMargin),
      breakagePercent: Number(breakagePercent),
      costFormationMode,
      basis: 'carcass' as const
    };
    StorageService.saveYieldParams(updated);
    if (onSaveYieldParams) {
      onSaveYieldParams(updated);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const selectedBatchInfo = realBatches.find(b => b.id === selectedBatchId);

  return (
    <div className="space-y-6">
      
      {/* 1. REAL DATABASE & RETAIL STANDARDS VERIFICATION BANNER */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 border-2 border-emerald-500/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                DADOS 100% REAIS • PADRÃO VAREJO AÇOUGUE
              </span>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Quebra Padrão de 25% (20% a 30%) + Graxaria Auxiliar
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Cálculo técnico padrão de mercado: <strong>75,0% carne limpa comercializável</strong> e <strong>25,0% quebra técnica de desossa</strong> (osso, sebo e aparas), com formação de custo direta e crédito auxiliar de graxaria.
            </p>
          </div>
        </div>

        {/* Data Source Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 shadow-2xs self-start md:self-auto shrink-0">
          <Layers className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Fonte:</span>
          <select
            value={selectedBatchId}
            onChange={(e) => handleSelectBatch(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2"
          >
            <option value="ERP_STANDARD">Catálogo Oficial de Produtos (ERP)</option>
            {realBatches.map(b => (
              <option key={b.id} value={b.id}>
                Lote {b.invoiceNumber} - {b.supplier} ({b.headsCount} bois, R$ {b.costPerKg ? b.costPerKg.toFixed(2) : (b.arrobaPrice/15).toFixed(2)}/kg)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Batch Summary Card if active */}
      {selectedBatchInfo && (
        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-indigo-600 text-white font-mono text-[10px] font-bold">LOTE</span>
            <span className="font-bold text-indigo-900 dark:text-indigo-200">
              {selectedBatchInfo.invoiceNumber} — {selectedBatchInfo.supplier}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              {selectedBatchInfo.headsCount} cabeças • Peso Total: {formatNumberBR(selectedBatchInfo.totalGrossWeightKg, 0)} kg
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
              Méd: {Math.round(selectedBatchInfo.totalGrossWeightKg / selectedBatchInfo.headsCount)} kg/boi
            </span>
            <span className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 text-emerald-700 dark:text-emerald-300 font-bold">
              {formatCurrencyBRL(selectedBatchInfo.costPerKg || (selectedBatchInfo.arrobaPrice / 15))}/kg (R$ {selectedBatchInfo.arrobaPrice.toFixed(2)}/@)
            </span>
          </div>
        </div>
      )}

      {/* 2. HEADER & PARAMETER CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                <Scissors className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Apuração Real de Rendimento e Desossa do Boi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Formação de custo efetivo da carne limpa no varejo supermercadista com quebra técnica padrão e crédito de graxaria
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {Object.keys(customSellingPrices).length > 0 && (
              <button
                type="button"
                onClick={handleSavePricesToDatabase}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
              >
                {savedProductsSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Preços Gravados no ERP!</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Salvar Preços na Tabela de Produtos</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveToSettings}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Parâmetros Salvos no ERP!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Parâmetros da Desossa</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#113829] to-slate-800 hover:from-[#1a4e3a] hover:to-slate-750 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm border border-emerald-500/40 active:scale-95 cursor-pointer"
              title="Abrir Relatório Executivo Oficial de Desossa com download de PDF, impressão e compartilhamento via WhatsApp"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Gerar Relatório Executivo</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTechnicalPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm border border-emerald-400 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Exportar PDF técnico com detalhamento do rendimento da desossa, gráfico de rosca de distribuição de peso e tabela de preços calculados"
            >
              {pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>PDF Exportado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-100" />
                  <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Exportar PDF Técnico'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Seletor de Modo de Formação de Custo */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Modo de Formação de Custo:
            </span>
            <span className="text-[11px] text-slate-500">
              (Escolha como o custo da carne limpa é formado para o balcão)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCostFormationMode('VAREJO_PADRAO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                costFormationMode === 'VAREJO_PADRAO'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {costFormationMode === 'VAREJO_PADRAO' && <Check className="w-3.5 h-3.5" />}
              <span>Padrão Varejo (Quebra Técnica {breakagePercent.toFixed(1)}%)</span>
            </button>

            <button
              type="button"
              onClick={() => setCostFormationMode('COM_GRAXARIA_AUXILIAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                costFormationMode === 'COM_GRAXARIA_AUXILIAR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {costFormationMode === 'COM_GRAXARIA_AUXILIAR' && <Check className="w-3.5 h-3.5" />}
              <span>Com Crédito Graxaria Auxiliar</span>
            </button>
          </div>
        </div>

        {/* Input parameters grid */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          {/* 1. Peso da Carcaça - Campo Mestre Real */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-lg border-2 border-amber-300 dark:border-amber-700 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block">
                Peso Carcaça / Lote
              </label>
              <span className="flex items-center gap-0.5 text-[9px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                <Link2 className="w-2.5 h-2.5" />
                <span>MESTRE</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                step="1"
                value={carcassWeight}
                onChange={(e) => setCarcassWeight(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded px-2 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
              />
              <span className="text-xs text-amber-900 dark:text-amber-200 font-bold">kg</span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 block font-medium">
              Equivale a {(carcassWeight / 15).toFixed(1)} @
            </span>
          </div>

          {/* 2. Custo de Compra por Kg Real */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Custo Compra (R$/kg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                step="0.10"
                value={costPerKg}
                onChange={(e) => setCostPerKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Preço carcaça c/ osso
            </span>
          </div>

          {/* 3. Preço da Arroba correspondente Real */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Preço Arroba (R$/@)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="150"
                step="1"
                value={arrobaPrice}
                onChange={(e) => handleArrobaChange(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/@</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              1 @ = 15 kg carcaça
            </span>
          </div>

          {/* 4. Quebra Técnica da Desossa (Padrão 25%, faixa 20% a 30%) */}
          <div className="bg-rose-50/70 dark:bg-rose-950/30 p-3 rounded-lg border-2 border-rose-300 dark:border-rose-700 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider block">
                Quebra Desossa (%)
              </label>
              <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                PADRÃO 25%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="15"
                max="35"
                step="0.5"
                value={breakagePercent}
                onChange={(e) => setBreakagePercent(Number(e.target.value) || 25.0)}
                className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded px-2 py-1.5 text-sm font-mono font-black text-rose-700 dark:text-rose-300 focus:outline-none focus:border-rose-500"
              />
              <span className="text-xs text-rose-900 dark:text-rose-200 font-bold">%</span>
            </div>
            
            {/* Botões rápidos de presets de quebra */}
            <div className="flex items-center gap-1 mt-1.5">
              {[
                { val: 20, label: '20%' },
                { val: 25, label: '25% (Padrão)' },
                { val: 28, label: '28%' },
                { val: 30, label: '30%' }
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setBreakagePercent(p.val)}
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition cursor-pointer ${
                    breakagePercent === p.val 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Venda de Sebo Real (Graxaria Auxiliar) */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Sebo Graxaria (R$/kg)
              </label>
              <button
                type="button"
                onClick={() => setFatPriceKg(4.85)}
                className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                title="Aplicar cotação de mercado (R$ 4,85/kg)"
              >
                R$ 4,85
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                step="0.05"
                value={fatPriceKg}
                onChange={(e) => setFatPriceKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Graxaria industrial (~6.5%)
            </span>
          </div>

          {/* 6. Venda de Osso Real (Graxaria Auxiliar) */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Osso Graxaria (R$/kg)
              </label>
              <button
                type="button"
                onClick={() => setBonePriceKg(0.90)}
                className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                title="Aplicar cotação de mercado (R$ 0,90/kg)"
              >
                R$ 0,90
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.2"
                step="0.05"
                value={bonePriceKg}
                onChange={(e) => setBonePriceKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Rendering FCO (~17.0%)
            </span>
          </div>

        </div>
      </div>

      {/* 3. KPI METRIC CARDS OF REAL YIELD & RETAIL BREAKAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Custo Efetivo Real da Carne Limpa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider">
              {costFormationMode === 'VAREJO_PADRAO' ? 'Custo Base Carne Limpa (Varejo)' : 'Custo Líquido c/ Graxaria'}
            </span>
            <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
            {formatCurrencyBRL(realYield.effectiveCleanMeatCostPerKg)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> /kg limpo</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Carcaça com Osso:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrencyBRL(costPerKg)}/kg</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Fator Quebra ({realYield.breakagePercent.toFixed(1)}%):</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                +{(((realYield.baseCleanMeatCostPerKg - costPerKg) / costPerKg) * 100).toFixed(1)}% ({realYield.breakageMultiplier.toFixed(4)}x)
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <span>Crédito Graxaria Auxiliar:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                -R$ {realYield.graxariaDiscountPerKg.toFixed(2)}/kg ({formatCurrencyBRL(realYield.wasteRevenue)}/boi)
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Rendimento de Carne Limpa vs Quebra Técnica */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider">
              Rendimento da Desossa
            </span>
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {realYield.cleanMeatYieldPercent.toFixed(1)}%
            <span className="text-xs font-normal text-slate-500"> Carne Limpa</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Carne Comercializável:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatNumberBR(realYield.totalCleanMeatKg, 1)} kg</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Quebra Total ({realYield.breakagePercent.toFixed(1)}%):</span>
              <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatNumberBR(realYield.totalWasteKg, 1)} kg</strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <span>Composição da Quebra:</span>
              <span className="text-slate-600 dark:text-slate-300 font-mono font-medium">Osso 17% • Sebo 6.5% • Quebra 1.5%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Faturamento Real da Desossa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider">
              Faturamento no Balcão
            </span>
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            {formatCurrencyBRL(realYield.totalRevenue)}
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Custo Total Carcaça:</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrencyBRL(realYield.totalCost)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Lucro Bruto Obtido:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{formatCurrencyBRL(realYield.grossProfit)}</strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <span>Venda de Graxaria:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{formatCurrencyBRL(realYield.wasteRevenue)}</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Margem Global Real */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider">
              Margem Global Real
            </span>
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
              {realYield.globalMarginSalePercent}%
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">s/ venda</span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Markup sobre Compra:</span>
              <strong className="text-purple-700 dark:text-purple-300 font-mono">+{realYield.globalMarginCostPercent}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Meta Cadastrada:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{targetMargin}%</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <span>Status Operacional:</span>
              <strong className={realYield.globalMarginSalePercent >= targetMargin ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}>
                {realYield.globalMarginSalePercent >= targetMargin ? '🟢 Acima da Meta' : '🟡 Ajustar Balcão'}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* 3.4. GRÁFICO DE ROSCA VISUAL • DISTRIBUIÇÃO DE PESO DA DESOSSA */}
      <BeefYieldDonutChart
        carcassWeight={carcassWeight}
        costPerKg={costPerKg}
        primaryMesas={realYield.primaryMesas}
        cuts={realYield.cuts}
        breakagePercent={breakagePercent}
        selectedMesaFilter={selectedMesaFilter}
        onSelectMesaFilter={(filter) => setSelectedMesaFilter(filter)}
      />

      {/* 3.5. PAINEL ANALÍTICO DAS MESAS DE DESMEMBRAMENTO PRIMÁRIO (PEÇAS INTEIRAS) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#113829] to-slate-950 text-white rounded-2xl p-5 shadow-xl border border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span>Mesas de Desmembramento da Carcaça Bovina</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    4 Grandes Peças Frigoríficas
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-3xl leading-relaxed">
                Formação analítica de custos gerada automaticamente a partir do <strong>Custo do Boi (R$ {costPerKg.toFixed(2)}/kg)</strong>. Balizamento zootécnico oficial de mercado (Dianteiro, Traseiro, Coxão e Alcatrão) para equalização contábil e formação dos preços dos cortes de balcão.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMesaGuideOpen(!isMesaGuideOpen)}
            className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>{isMesaGuideOpen ? 'Ocultar Paridade' : 'Fórmula de Paridade'}</span>
          </button>
        </div>

        {/* Guia Metodológico de Paridade de Mercado se ativo */}
        {isMesaGuideOpen && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">1. PEÇA DIANTEIRO (39%)</span>
              <p className="mt-1 text-[11px] text-slate-400">
                Fator: <strong>0,81x do Boi Casado</strong> (~81%). Compõe 39% do peso da carcaça e abastece a desossa de segunda com Paleta, Acém, Peito e Músculo.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">2. PEÇA TRAZEIRO (48%)</span>
              <p className="mt-1 text-[11px] text-slate-400">
                Fator: <strong>1,246x do Boi Casado</strong> (~125%). Traseiro Especial (Serrote c/ osso). Subdivide-se nas mesas de Coxão (62,5%) e Alcatrão (37,5%).
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">3. PEÇA COXAO (30%)</span>
              <p className="mt-1 text-[11px] text-slate-400">
                Fator: <strong>1,16x do Boi Casado</strong> (~116%). Mesa de perna (30% da carcaça) que gera Coxão Mole, Coxão Duro, Patinho e Lagarto.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">4. PEÇA ALCATRAO (18%)</span>
              <p className="mt-1 text-[11px] text-slate-400">
                Fator: <strong>1,39x do Boi Casado</strong> (~139%). Mesa nobre de lombo (18% da carcaça) que gera Picanha, Mignon, Alcatra e Contra Filé.
              </p>
            </div>
          </div>
        )}

        {/* 4 Cards das Mesas Solicitadas pelo Usuário */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {realYield.primaryMesas.filter(m => ['BOI-DIANT', 'BOI-TRAS', 'BOI-COXAO', 'BOI-ALCAT'].includes(m.code)).map((mesa) => {
            const isFilterActive = selectedMesaFilter === mesa.code;
            const isTraseiro = mesa.code === 'BOI-TRAS';
            const isAlcatrao = mesa.code === 'BOI-ALCAT';
            const isCoxao = mesa.code === 'BOI-COXAO';

            return (
              <div 
                key={mesa.id}
                className={`rounded-xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                  isFilterActive 
                    ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg' 
                    : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      isAlcatrao ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      isCoxao ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                      isTraseiro ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {mesa.carcassPercent.toFixed(1)}% Carcaça
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Fator: {mesa.marketCostFactor}x
                    </span>
                  </div>

                  {/* Nome da Peça Solicitada */}
                  <h4 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                    <span>{mesa.alias}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {mesa.name}
                  </p>

                  {/* Custo Analítico Gerado a partir do Custo do Boi */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Custo Analítico:</span>
                      <span className="text-[10px] text-emerald-400 font-bold font-mono">
                        ({(mesa.marketCostFactor * 100).toFixed(0)}% s/ boi)
                      </span>
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                      {formatCurrencyBRL(mesa.calculatedCostKg)}
                      <span className="text-xs font-normal text-slate-400">/kg</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-850">
                      <span>Peso no Lote:</span>
                      <strong className="text-white font-mono">{mesa.weightKg.toFixed(1)} kg</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Custo Total Peça:</span>
                      <strong className="text-slate-200 font-mono">{formatCurrencyBRL(mesa.totalCostR$)}</strong>
                    </div>
                  </div>

                  {/* Preço de Venda Praticado no ERP */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 font-semibold">Preço Venda Peça:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          min="1"
                          value={mesa.sellingPriceKg}
                          onChange={(e) => handlePriceChange(mesa.code, Number(e.target.value) || 0)}
                          className="w-16 px-1 py-0.5 text-right font-mono font-bold text-white bg-slate-950 border border-slate-700 rounded focus:outline-none focus:border-emerald-400 text-xs"
                          title="Preço de venda da peça inteira no catálogo (editável)"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Média Cortes Desossados:</span>
                      <strong className="text-amber-300 font-mono">{formatCurrencyBRL(mesa.averageDerivedPriceKg)}/kg</strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Margem da Desossa:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        +{mesa.marginOnCostPercent}% ({mesa.marginOnSalePercent}% margem)
                      </span>
                    </div>
                  </div>

                  {/* Cortes que Saem Desta Peça */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Cortes que saem da peça:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {mesa.derivedCutNames.map((cutName, cIdx) => (
                        <span 
                          key={cIdx}
                          className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {cutName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botão de Filtragem de Cortes */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setSelectedMesaFilter(selectedMesaFilter === mesa.code ? 'ALL' : (mesa.code as any))}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isFilterActive
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>{isFilterActive ? 'Remover Filtro' : `Ver Cortes do ${mesa.alias.replace('PEÇA ', '')}`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.6. TABELA TÉCNICA DETALHADA • FORMAÇÃO AUTOMÁTICA DE PREÇOS POR RENTABILIDADE DE MERCADO */}
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-5 shadow-xl transition-colors">
        
        {/* Header da Tabela Técnica */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Tabela Técnica de Formação de Preço de Venda • Rentabilidade de Mercado</span>
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Cálculo Automatizado p/ Dianteiro, Traseiro, Coxão e Alcatrão
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Calcula automaticamente o preço de venda a partir do <strong>Custo do Boi ({formatCurrencyBRL(costPerKg)}/kg)</strong> aplicando fatores zootécnicos e percentuais de rentabilidade predefinidos (margens e markups de mercado).
              </p>
            </div>
          </div>

          {/* Seletor de Presets de Rentabilidade de Mercado */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preset Rentabilidade:</span>
            </span>

            <button
              type="button"
              onClick={() => handlePresetChange('COMPETITIVO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                profitabilityPreset === 'COMPETITIVO'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Margem agressiva de giro rápido (18% a 28%)"
            >
              <span>⚡ Competitivo (Giro)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('PADRAO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                profitabilityPreset === 'PADRAO'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Padrão oficial do varejo supermercadista (25% a 34%)"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>🎯 Padrão Varejo (Recomendado)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetChange('PREMIUM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                profitabilityPreset === 'PREMIUM'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Margem nobre para carnes de alta qualidade / boutique (30% a 42%)"
            >
              <span>💎 Nobre / Premium</span>
            </button>

            {profitabilityPreset === 'CUSTOM' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                ⚙️ Customizado
              </span>
            )}

            <button
              type="button"
              onClick={handleDownloadTechnicalPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title="Exportar PDF técnico com detalhamento do rendimento da desossa, gráfico de rosca de distribuição de peso e tabela de preços calculados"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
            </button>
          </div>
        </div>

        {/* Tabela Técnica Completa */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Peça Primária (Mesa Frigorífica)</th>
                <th className="px-3 py-3 text-center">% Carcaça</th>
                <th className="px-3 py-3 text-center">Fator Paridade</th>
                <th className="px-3 py-3 text-right">Custo Boi Base</th>
                <th className="px-3 py-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20">Custo Analítico (R$/kg)</th>
                <th className="px-3 py-3 text-right">Peso no Lote</th>
                <th className="px-3 py-3 text-center">Rentabilidade s/ Venda</th>
                <th className="px-3 py-3 text-right">Markup s/ Compra</th>
                <th className="px-3 py-3 text-right bg-emerald-100/50 dark:bg-emerald-900/30 font-black">Preço Sugerido (R$/kg)</th>
                <th className="px-3 py-3 text-right">Preço Praticado ERP</th>
                <th className="px-3 py-3 text-center">Status / Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-xs">
              {realYield.primaryMesas.map((mesa) => {
                const targetMarg = mesaProfitMargins[mesa.code] ?? (mesa.marginOnSalePercent || 28);
                const suggestedSellingPrice = Number((mesa.calculatedCostKg / (1 - targetMarg / 100)).toFixed(2));
                const markupOnCost = Number((((suggestedSellingPrice - mesa.calculatedCostKg) / mesa.calculatedCostKg) * 100).toFixed(1));
                const currentErpPrice = mesa.sellingPriceKg;
                const priceDiff = currentErpPrice - suggestedSellingPrice;
                const isExact = Math.abs(priceDiff) < 0.10;
                const isAbove = priceDiff >= 0.10;

                return (
                  <tr key={mesa.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                    {/* Nome da Peça */}
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 font-bold">
                          <Boxes className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 dark:text-white text-xs">
                              {mesa.alias}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">({mesa.code})</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {mesa.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* % da Carcaça */}
                    <td className="px-3 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {mesa.carcassPercent.toFixed(1)}%
                    </td>

                    {/* Fator de Paridade */}
                    <td className="px-3 py-3 text-center font-bold text-slate-600 dark:text-slate-300">
                      {mesa.marketCostFactor.toFixed(3)}x
                    </td>

                    {/* Custo Boi Base */}
                    <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400">
                      {formatCurrencyBRL(costPerKg)}
                    </td>

                    {/* Custo Analítico da Peça */}
                    <td className="px-3 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-sm">
                      {formatCurrencyBRL(mesa.calculatedCostKg)}
                      <span className="text-[10px] text-slate-400 font-normal">/kg</span>
                    </td>

                    {/* Peso no Lote */}
                    <td className="px-3 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {mesa.weightKg.toFixed(1)} kg
                    </td>

                    {/* Rentabilidade Desejada s/ Venda (%) */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                        <input
                          type="number"
                          step="0.5"
                          min="5"
                          max="80"
                          value={targetMarg}
                          onChange={(e) => handleMesaMarginChange(mesa.code, Number(e.target.value) || 0)}
                          className="w-12 text-center font-bold text-purple-700 dark:text-purple-300 bg-transparent focus:outline-none text-xs"
                          title="Margem sobre venda predefinida (editável)"
                        />
                        <span className="text-[10px] font-bold text-purple-600">%</span>
                      </div>
                    </td>

                    {/* Markup s/ Compra */}
                    <td className="px-3 py-3 text-right font-bold text-purple-600 dark:text-purple-400">
                      +{markupOnCost.toFixed(1)}%
                    </td>

                    {/* Preço de Venda Sugerido */}
                    <td className="px-3 py-3 text-right bg-emerald-100/60 dark:bg-emerald-900/40 text-sm font-black text-emerald-800 dark:text-emerald-300">
                      {formatCurrencyBRL(suggestedSellingPrice)}
                      <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">/kg</span>
                    </td>

                    {/* Preço Praticado ERP (editável) */}
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] text-slate-400">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          min="1"
                          value={currentErpPrice}
                          onChange={(e) => handlePriceChange(mesa.code, Number(e.target.value) || 0)}
                          className="w-20 px-1.5 py-1 text-right font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:border-emerald-500 text-xs shadow-2xs"
                          title="Preço praticado atualmente no cadastro do ERP (editável)"
                        />
                      </div>
                    </td>

                    {/* Status & Ação Individual */}
                    <td className="px-3 py-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                          isExact
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : isAbove
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        }`}>
                          {isExact ? '🟢 Alinhado' : isAbove ? `🔵 +R$ ${priceDiff.toFixed(2)}` : `🟡 -R$ ${Math.abs(priceDiff).toFixed(2)}`}
                        </span>

                        {!isExact && (
                          <button
                            type="button"
                            onClick={() => handleApplySingleSuggestedPrice(mesa.code, suggestedSellingPrice)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                            title={`Aplicar R$ ${suggestedSellingPrice.toFixed(2)} diretamente na tabela de produtos do ERP`}
                          >
                            Aplicar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Ações da Tabela Técnica */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Fórmula técnica: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400">Preço Sugerido = Custo Analítico / (1 - Margem% / 100)</code>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApplyAllSuggestedPrices}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
              title="Aplica todos os preços sugeridos calculados na tabela de produtos do ERP de forma definitiva"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Aplicar Todos os Preços Sugeridos ao ERP</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#113829] hover:bg-[#1a4e3a] text-white text-xs font-bold flex items-center gap-2 transition border border-emerald-500/30 cursor-pointer active:scale-95 shadow-sm"
              title="Gerar relatório executivo com tabelas e indicadores de desossa"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Relatório Executivo</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTechnicalPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm border border-emerald-400/40 disabled:opacity-50"
              title="Exportar PDF técnico com detalhamento do rendimento da desossa, gráfico de rosca de distribuição de peso e tabela de preços calculados"
            >
              {pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>PDF Exportado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-100" />
                  <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Exportar PDF Técnico (Rosca & Preços)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* 4. REAL CUTS DETAIL TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Detalhamento dos Cortes & Peças de Desmembramento • Base Oficial do ERP</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Custo equalizado proporcional ao valor comercial de balcão. As peças primárias (Dianteiro, Traseiro, Coxão e Alcatrão) atuam como base geradora dos cortes derivados.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleDownloadTechnicalPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
              title="Exportar PDF técnico com detalhamento do rendimento da desossa, gráfico de rosca de distribuição de peso e tabela de preços calculados"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Gerando...' : 'Exportar PDF Técnico'}</span>
            </button>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold">
              {displayedCuts.length} exibidos de {realYield.cuts.length} itens
            </span>
            {Object.keys(customSellingPrices).length > 0 && (
              <button
                type="button"
                onClick={() => setCustomSellingPrices({})}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Descartar edições locais e recarregar os preços originais do banco"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Preços Originais</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar de Filtros por Mesa e Tipo de Corte */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar Visão:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedMesaFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                selectedMesaFilter === 'ALL'
                  ? 'bg-[#113829] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              Todos ({realYield.cuts.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedMesaFilter('MESAS_ONLY')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedMesaFilter === 'MESAS_ONLY'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-50'
              }`}
            >
              <Boxes className="w-3 h-3" />
              <span>Apenas Peças Primárias (4 Mesas)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMesaFilter('BOI-ALCAT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                selectedMesaFilter === 'BOI-ALCAT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              Mesa Alcatrão
            </button>

            <button
              type="button"
              onClick={() => setSelectedMesaFilter('BOI-COXAO')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                selectedMesaFilter === 'BOI-COXAO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              Mesa Coxão
            </button>

            <button
              type="button"
              onClick={() => setSelectedMesaFilter('BOI-DIANT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                selectedMesaFilter === 'BOI-DIANT'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              Mesa Dianteiro
            </button>

            <button
              type="button"
              onClick={() => setSelectedMesaFilter('WASTE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                selectedMesaFilter === 'WASTE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              Graxaria & Quebra
            </button>
          </div>

          {selectedMesaFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedMesaFilter('ALL')}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              Limpar filtro
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Corte / Peça / Código ERP</th>
                <th className="px-3 py-3 text-center">Classificação</th>
                <th className="px-3 py-3 text-right">Rendimento %</th>
                <th className="px-3 py-3 text-right">Peso Obtido (kg)</th>
                <th className="px-3 py-3 text-right">Custo Equalizado (R$/kg)</th>
                <th className="px-3 py-3 text-right">Preço Venda Real (R$/kg)</th>
                <th className="px-3 py-3 text-right">Faturamento Real</th>
                <th className="px-3 py-3 text-right">Markup s/ Compra</th>
                <th className="px-3 py-3 text-right">Margem s/ Venda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {displayedCuts.map((cut, idx) => {
                const isWaste = cut.isWaste;
                const isPrimary = cut.isPrimaryPiece;
                const isCustomized = cut.productCode && customSellingPrices[cut.productCode] !== undefined;

                return (
                  <tr 
                    key={idx}
                    className={`transition-colors ${
                      isPrimary
                        ? 'bg-amber-50/80 dark:bg-amber-950/25 border-l-4 border-l-amber-500 text-slate-900 dark:text-amber-100 font-semibold'
                        : isWaste 
                        ? 'bg-rose-50/50 dark:bg-rose-950/10 text-slate-500 dark:text-slate-400 hover:bg-rose-50' 
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Name & Product Code */}
                    <td className="px-4 py-2.5 font-sans font-medium">
                      <div className="flex items-center gap-2">
                        {isPrimary ? (
                          <div className="p-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                            <Boxes className="w-4 h-4" />
                          </div>
                        ) : isWaste ? (
                          <Bone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : cut.category === 'NOBRE' ? (
                          <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold ${
                              isPrimary 
                                ? 'text-amber-950 dark:text-amber-200 text-[13px] tracking-tight uppercase' 
                                : isWaste 
                                ? 'text-rose-700 dark:text-rose-300 font-semibold' 
                                : cut.category === 'NOBRE' 
                                ? 'text-amber-800 dark:text-amber-300 font-bold' 
                                : ''
                            }`}>
                              {cut.name}
                            </span>

                            {isPrimary && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950 shadow-2xs">
                                PEÇA PRIMÁRIA • MESA
                              </span>
                            )}

                            {cut.parentMesaName && !isPrimary && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Mesa: {cut.parentMesaName}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            {cut.productCode && (
                              <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 rounded">
                                {cut.productCode}
                              </span>
                            )}
                            {isPrimary && cut.derivedCutsList && (
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 italic">
                                • Gera: {cut.derivedCutsList.slice(0, 3).join(', ')}{cut.derivedCutsList.length > 3 ? '...' : ''}
                              </span>
                            )}
                            {isCustomized && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold text-[9px]">• editado</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2.5 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isPrimary
                          ? 'bg-amber-600 text-white font-bold'
                          : isWaste 
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30' 
                          : cut.category === 'NOBRE' 
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30' 
                          : cut.category === 'COXAO'
                          ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {cut.category === 'MESA_PRIMARIA' ? 'MESA PRIMÁRIA' : cut.category}
                      </span>
                    </td>

                    {/* Rendimento % */}
                    <td className="px-3 py-2.5 text-right font-medium">
                      <span className={isPrimary ? 'font-bold text-amber-700 dark:text-amber-300' : ''}>
                        {cut.yieldPercent.toFixed(1)}%
                      </span>
                    </td>

                    {/* Peso kg */}
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      {cut.weightKg.toFixed(2)} kg
                    </td>

                    {/* Custo equalizado R$/kg */}
                    <td className="px-3 py-2.5 text-right font-medium">
                      {isWaste ? (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans font-bold bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          Crédito Graxaria
                        </span>
                      ) : (
                        <div>
                          <span className={`font-bold ${isPrimary ? 'text-amber-800 dark:text-amber-300 text-xs' : 'text-slate-700 dark:text-slate-300'}`}>
                            {formatCurrencyBRL(cut.costPriceKg)}
                          </span>
                          {isPrimary && (
                            <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-sans font-normal">
                              Fator Zootécnico
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Preço de venda real (editável em tempo real) */}
                    <td className="px-3 py-2.5 text-right">
                      {cut.productCode && !isWaste ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.50"
                            min="1"
                            value={cut.sellingPriceKg}
                            onChange={(e) => handlePriceChange(cut.productCode!, Number(e.target.value) || 0)}
                            className={`w-20 px-1.5 py-0.5 text-right font-mono font-bold rounded focus:outline-none focus:ring-1 ${
                              isPrimary
                                ? 'text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-700 focus:ring-amber-500'
                                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500'
                            }`}
                            title="Preço praticado na base de dados (editável)"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyBRL(cut.sellingPriceKg)}
                        </span>
                      )}
                    </td>

                    {/* Faturamento */}
                    <td className="px-3 py-2.5 text-right text-slate-900 dark:text-slate-100 font-bold">
                      {formatCurrencyBRL(cut.revenueR$)}
                    </td>

                    {/* Margem s/ Compra (Markup) */}
                    <td className="px-3 py-2.5 text-right">
                      {isWaste ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          +100% Retorno
                        </span>
                      ) : (
                        <span className={cut.marginOnCostPercent > 40 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                          +{cut.marginOnCostPercent}%
                        </span>
                      )}
                    </td>

                    {/* Margem s/ Venda */}
                    <td className="px-3 py-2.5 text-right">
                      {isWaste ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {cut.name.includes('Sebo') ? 'Abate R$ 0,32/kg' : cut.name.includes('Osso') ? 'Abate R$ 0,14/kg' : 'Evaporação'}
                        </span>
                      ) : (
                        <span className={`font-bold ${
                          cut.marginOnSalePercent >= 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {cut.marginOnSalePercent}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals footer */}
            <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700 font-mono text-xs">
              <tr className="text-slate-900 dark:text-white">
                <td className="px-4 py-3 font-sans">TOTAL GERAL CARCAÇA</td>
                <td className="text-center">-</td>
                <td className="text-right text-amber-600 dark:text-amber-400">100.0%</td>
                <td className="text-right text-slate-900 dark:text-white font-bold">{carcassWeight.toFixed(2)} kg</td>
                <td className="text-right text-slate-600 dark:text-slate-300">{formatCurrencyBRL(costPerKg)}</td>
                <td className="text-right text-slate-400">-</td>
                <td className="text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrencyBRL(realYield.totalRevenue)}</td>
                <td className="text-right text-purple-600 dark:text-purple-400">+{realYield.globalMarginCostPercent}%</td>
                <td className="text-right text-purple-600 dark:text-purple-400">{realYield.globalMarginSalePercent}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. EXPLANATORY BOX ON RETAIL BEEF YIELD & BREAKAGE ECONOMICS */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-700 dark:text-slate-300 transition-colors">
        <div className="space-y-2">
          <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Bone className="w-4 h-4" />
            <span>Formação Operacional do Custo no Mercado Varejista</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Quebra Técnica Padrão de 25,0% (faixa de 20% a 30%):</strong> Ao adquirir uma carcaça com osso de <strong>{carcassWeight} kg</strong> a <strong>{formatCurrencyBRL(costPerKg)}/kg</strong> (investimento de {formatCurrencyBRL(realYield.totalCost)}), a desossa gera <strong>{formatNumberBR(realYield.totalCleanMeatKg, 1)} kg de carne limpa (75,0%)</strong> e <strong>{formatNumberBR(realYield.totalWasteKg, 1)} kg de quebra/descarte (25,0%)</strong>.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Fator Multiplicador de Quebra:</strong> Para cobrir a perda de peso dos 25%, o multiplicador é de <strong>1,3333x (+33,33%)</strong>, formando o <strong>Custo Base Varejo de {formatCurrencyBRL(realYield.baseCleanMeatCostPerKg)}/kg</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Boxes className="w-4 h-4" />
            <span>Paridade de Mercado das 4 Peças Primárias</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Dianteiro (39% • 0,81x):</strong> R$ {(costPerKg * 0.81).toFixed(2)}/kg para formação de Paleta, Acém, Peito e Músculo.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Traseiro Especial (48% • 1,246x):</strong> R$ {(costPerKg * 1.246).toFixed(2)}/kg. Subdividido analiticamente em <strong>Coxão (30% • 1,16x = R$ {(costPerKg * 1.16).toFixed(2)}/kg)</strong> e <strong>Alcatrão (18% • 1,39x = R$ {(costPerKg * 1.39).toFixed(2)}/kg)</strong>.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Equalização Contábil:</strong> A soma ponderada das peças fecha rigorosamente em 100% do custo pago pelo boi casado.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Graxaria como Crédito Auxiliar de Recuperação</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Receita Residual de Graxaria:</strong> A venda do sebo (R$ {fatPriceKg.toFixed(2)}/kg) e do osso (R$ {bonePriceKg.toFixed(2)}/kg) gera <strong>{formatCurrencyBRL(realYield.wasteRevenue)} por boi</strong>.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Abatimento Efetivo:</strong> Esse valor atua como crédito auxiliar abatendo <strong>R$ {realYield.graxariaDiscountPerKg.toFixed(2)}/kg</strong> da carne limpa, resultando no <strong>Custo Líquido com Graxaria de {formatCurrencyBRL(realYield.netCleanMeatCostPerKg)}/kg</strong>.
          </p>
        </div>
      </div>

      {/* 6. MODAL DO RELATÓRIO EXECUTIVO OFICIAL DE DESOSSA */}
      {isReportModalOpen && (
        <YieldReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          carcassWeight={carcassWeight}
          costPerKg={costPerKg}
          breakagePercent={breakagePercent}
          costFormationMode={costFormationMode}
          targetMargin={targetMargin}
          selectedBatchName={selectedBatchInfo ? `Lote ${selectedBatchInfo.invoiceNumber} - ${selectedBatchInfo.supplier}` : 'Catálogo Oficial ERP'}
          realYield={realYield}
          presetProfitableMode={profitabilityPreset}
          mesaProfitMargins={mesaProfitMargins}
        />
      )}

    </div>
  );
};
