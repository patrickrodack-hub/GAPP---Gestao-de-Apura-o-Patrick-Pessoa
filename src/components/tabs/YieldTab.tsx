import React, { useState, useEffect, useMemo } from 'react';
import { 
  calculateRealBeefYield, 
  formatCurrencyBRL, 
  formatNumberBR, 
  arrobaToKg, 
  kgToArroba 
} from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { PurchaseBatch, Product, YieldParams } from '../../types/erp';
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
  Building2
} from 'lucide-react';

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

      {/* 4. REAL CUTS DETAIL TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Detalhamento dos Cortes • Base de Dados Oficial de Produtos & Quebra Técnica</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Custo equalizado proporcional ao valor comercial de balcão (Standard Butchery Accounting). Clique no preço de venda para editar e gravar no ERP.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold">
              {realYield.cuts.length} itens no ERP
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

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Corte / Código ERP</th>
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
              {realYield.cuts.map((cut, idx) => {
                const isWaste = cut.isWaste;
                const isCustomized = cut.productCode && customSellingPrices[cut.productCode] !== undefined;

                return (
                  <tr 
                    key={idx}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isWaste ? 'bg-rose-50/50 dark:bg-rose-950/10 text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Name & Product Code */}
                    <td className="px-4 py-2.5 font-sans font-medium">
                      <div className="flex items-center gap-2">
                        {isWaste ? (
                          <Bone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : cut.category === 'NOBRE' ? (
                          <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                        )}
                        <div>
                          <div className={`font-semibold ${isWaste ? 'text-rose-700 dark:text-rose-300' : cut.category === 'NOBRE' ? 'text-amber-800 dark:text-amber-300 font-bold' : ''}`}>
                            {cut.name}
                          </div>
                          {cut.productCode && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                              <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 rounded">
                                {cut.productCode}
                              </span>
                              {isCustomized && (
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-[9px]">• editado</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2.5 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isWaste 
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30' 
                          : cut.category === 'NOBRE' 
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30' 
                          : cut.category === 'COXAO'
                          ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {cut.category}
                      </span>
                    </td>

                    {/* Rendimento % */}
                    <td className="px-3 py-2.5 text-right font-medium">
                      {cut.yieldPercent.toFixed(1)}%
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
                        <span className="text-slate-700 dark:text-slate-300 font-bold">
                          {formatCurrencyBRL(cut.costPriceKg)}
                        </span>
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
                            className="w-20 px-1.5 py-0.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700 dark:text-slate-300 transition-colors">
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

    </div>
  );
};
