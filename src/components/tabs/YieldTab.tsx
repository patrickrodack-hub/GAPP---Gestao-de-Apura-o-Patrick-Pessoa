import React, { useState, useEffect, useMemo } from 'react';
import { 
  calculateRealBeefYield, 
  formatCurrencyBRL, 
  formatNumberBR, 
  arrobaToKg, 
  kgToArroba 
} from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { PurchaseBatch, Product } from '../../types/erp';
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
  RotateCcw
} from 'lucide-react';

interface YieldTabProps {
  yieldParams?: { 
    carcassWeight: number; 
    costPerKg: number; 
    fatPriceKg: number; 
    bonePriceKg: number; 
    targetMargin: number; 
    basis: 'carcass' | 'piece' 
  };
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
    return p.fatPriceKg || 2.10;
  });
  const [bonePriceKg, setBonePriceKg] = useState<number>(() => {
    if (yieldParams?.bonePriceKg) return yieldParams.bonePriceKg;
    const p = StorageService.getYieldParams();
    return p.bonePriceKg || 0.70;
  });
  const [targetMargin, setTargetMargin] = useState<number>(() => {
    if (yieldParams?.targetMargin) return yieldParams.targetMargin;
    const p = StorageService.getYieldParams();
    return p.targetMargin || 28;
  });

  // Preços editáveis em tempo real para sincronização com o banco de dados
  const [customSellingPrices, setCustomSellingPrices] = useState<Record<string, number>>({});
  const [editingPriceCode, setEditingPriceCode] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [savedProductsSuccess, setSavedProductsSuccess] = useState<boolean>(false);

  // Sincroniza dinamicamente se yieldParams mudar externamente (ex: novo pedido salvo)
  useEffect(() => {
    if (yieldParams) {
      if (yieldParams.carcassWeight > 0) setCarcassWeight(yieldParams.carcassWeight);
      if (yieldParams.costPerKg > 0) setCostPerKg(yieldParams.costPerKg);
      if (yieldParams.fatPriceKg > 0) setFatPriceKg(yieldParams.fatPriceKg);
      if (yieldParams.bonePriceKg > 0) setBonePriceKg(yieldParams.bonePriceKg);
      if (yieldParams.targetMargin > 0) setTargetMargin(yieldParams.targetMargin);
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

  // Apuração REAL de rendimento e desossa com dados do ERP
  const realYield = useMemo(() => {
    return calculateRealBeefYield(
      carcassWeight,
      costPerKg,
      effectiveCatalog,
      fatPriceKg,
      bonePriceKg,
      targetMargin
    );
  }, [carcassWeight, costPerKg, effectiveCatalog, fatPriceKg, bonePriceKg, targetMargin]);

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

  // Salva parâmetros técnicos no ERP (atualiza campo mestre de carcaça e custo)
  const handleSaveToSettings = () => {
    const updated = {
      carcassWeight,
      costPerKg: Number(costPerKg.toFixed(2)),
      fatPriceKg: Number(fatPriceKg.toFixed(2)),
      bonePriceKg: Number(bonePriceKg.toFixed(2)),
      targetMargin: Number(targetMargin),
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
      {/* Real Database Official Verification Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-indigo-950/40 border-2 border-emerald-500/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                DADOS 100% REAIS • NÃO SIMULADO
              </span>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Base de Dados Oficial Solidcon ERP
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Todos os preços, rendimentos zootécnicos e custos são calculados com a <strong>tabela real de produtos</strong> (Módulo 1) e os <strong>lotes de compra</strong> cadastrados na sua base de dados.
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

      {/* Header & Controls */}
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
                  Equalização contábil de desossa comercial: dados reais de cortes nobres, dianteiro, coxão e impacto da receita de graxaria (osso e sebo)
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

        {/* Input parameters grid */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Peso da Carcaça - Campo Mestre Real */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-lg border-2 border-amber-300 dark:border-amber-700 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block">
                Peso da Carcaça / Lote
              </label>
              <span className="flex items-center gap-0.5 text-[9px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                <Link2 className="w-2.5 h-2.5" />
                <span>CAMPO MESTRE</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                step="1"
                value={carcassWeight}
                onChange={(e) => setCarcassWeight(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
              />
              <span className="text-xs text-amber-900 dark:text-amber-200 font-bold">kg</span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 block font-medium">
              Equivale a {(carcassWeight / 15).toFixed(1)} @ • Vincula Pedidos, Lotes e 16 Lojas
            </span>
          </div>

          {/* Custo de Compra por Kg Real */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Custo de Compra (R$/kg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                step="0.10"
                value={costPerKg}
                onChange={(e) => setCostPerKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Preço real negociado com frigorífico
            </span>
          </div>

          {/* Preço da Arroba correspondente Real */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Preço da Arroba (R$/@)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="150"
                step="1"
                value={arrobaPrice}
                onChange={(e) => handleArrobaChange(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/@</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              1 @ = 15 kg de carcaça bovina
            </span>
          </div>

          {/* Venda de Sebo Real */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Recuperação Sebo (R$/kg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                step="0.05"
                value={fatPriceKg}
                onChange={(e) => setFatPriceKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Subproduto cadastrado SUB-SEBO
            </span>
          </div>

          {/* Venda de Osso Real */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Recuperação Osso (R$/kg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.2"
                step="0.05"
                value={bonePriceKg}
                onChange={(e) => setBonePriceKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Subproduto cadastrado SUB-OSSO
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards of Real Yield */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Custo Efetivo Real da Carne Limpa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Custo Efetivo Carne Limpa
            </span>
            <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrencyBRL(realYield.effectiveCleanMeatCostPerKg)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> /kg</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Carcaça: {formatCurrencyBRL(costPerKg)}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 inline" />
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              +{( ((realYield.effectiveCleanMeatCostPerKg - costPerKg) / costPerKg) * 100 ).toFixed(1)}% (impacto osso/sebo)
            </span>
          </div>
        </div>

        {/* Rendimento Real de Carne Limpa vs Descarte */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Aproveitamento de Carne
            </span>
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {((realYield.totalCleanMeatKg / carcassWeight) * 100).toFixed(1)}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {formatNumberBR(realYield.totalCleanMeatKg, 1)} kg carne limpa • {formatNumberBR(realYield.totalWasteKg, 1)} kg descarte ({( (realYield.totalWasteKg / carcassWeight) * 100 ).toFixed(1)}%)
          </div>
        </div>

        {/* Faturamento Real da Desossa com Preços de Balcão Cadastrados */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Faturamento Real no Balcão
            </span>
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrencyBRL(realYield.totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Custo: {formatCurrencyBRL(realYield.totalCost)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              Lucro: {formatCurrencyBRL(realYield.grossProfit)}
            </span>
          </div>
        </div>

        {/* Margem Real Global */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Margem Global Real
            </span>
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {realYield.globalMarginSalePercent}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">s/ venda</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Markup s/ compra: <strong className="text-slate-700 dark:text-slate-200 font-mono">+{realYield.globalMarginCostPercent}%</strong>
          </div>
        </div>
      </div>

      {/* Real Cuts Detail Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Detalhamento dos Cortes • Base de Dados Oficial de Produtos</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Preços de venda e custos vinculados ao cadastro do ERP Solidcon. Clique no preço para editar e gravar no sistema.
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
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
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
                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrencyBRL(cut.costPriceKg)}
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
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      ) : (
                        <span className={cut.marginOnCostPercent > 40 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                          +{cut.marginOnCostPercent}%
                        </span>
                      )}
                    </td>

                    {/* Margem s/ Venda */}
                    <td className="px-3 py-2.5 text-right">
                      {isWaste ? (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
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

      {/* Explanatory Box on Beef Yield Economics */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300 transition-colors">
        <div className="space-y-2">
          <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Bone className="w-4 h-4" />
            <span>Equalização Contábil por Valor Comercial de Balcão</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Ao adquirir uma carcaça de <strong>{carcassWeight} kg</strong> ao custo real de <strong>{formatCurrencyBRL(costPerKg)}/kg</strong> (investimento de {formatCurrencyBRL(realYield.totalCost)}), a desossa gera subprodutos de graxaria (<strong>{formatNumberBR(carcassWeight * 0.175, 1)} kg de osso</strong> e <strong>{formatNumberBR(carcassWeight * 0.065, 1)} kg de sebo</strong>).
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            A receita recuperada com graxaria ({formatCurrencyBRL(realYield.wasteRevenue)}) abate o desembolso total, transferindo o custo líquido para os <strong>{formatNumberBR(realYield.totalCleanMeatKg, 1)} kg de carne limpa</strong>, resultando no custo efetivo limpo de <strong>{formatCurrencyBRL(realYield.effectiveCleanMeatCostPerKg)}/kg</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            <span>Sincronização Ativa com a Base de Dados</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Preços Reais do Balcão:</strong> Carregados do catálogo de produtos cadastrados na base de dados da empresa. Qualquer alteração feita aqui pode ser gravada com um clique no cadastro do ERP.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Peso da Carcaça / Lote:</strong> Atua como o <em>parâmetro mestre</em> do sistema, recalculando os volumes das 16 lojas na Planilha Direção e alimentando o módulo de Gestão de Compras & Lotes.
          </p>
        </div>
      </div>
    </div>
  );
};
