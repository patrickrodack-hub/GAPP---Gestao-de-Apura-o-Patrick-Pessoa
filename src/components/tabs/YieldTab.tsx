import React, { useState, useEffect } from 'react';
import { simulateBeefYield, formatCurrencyBRL, formatNumberBR, arrobaToKg, kgToArroba } from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { PurchaseBatch } from '../../types/erp';
import { 
  Scissors, 
  Scale, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  Bone, 
  Flame, 
  ArrowRight,
  ShieldAlert,
  Percent,
  Calculator,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface YieldTabProps {
  yieldParams?: { carcassWeight: number; costPerKg: number; fatPriceKg: number; bonePriceKg: number; targetMargin: number; basis: 'carcass' | 'piece' };
  onSaveYieldParams?: (params: any) => void;
  latestBatch?: PurchaseBatch;
}

export const YieldTab: React.FC<YieldTabProps> = ({
  yieldParams,
  onSaveYieldParams,
  latestBatch
}) => {
  // Parâmetros de simulação inicializados com dados persistidos ou do lote ativo
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
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

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

  const simulation = simulateBeefYield(
    carcassWeight,
    costPerKg,
    fatPriceKg,
    bonePriceKg,
    targetMargin
  );

  const arrobaPrice = kgToArroba(costPerKg);

  const handleArrobaChange = (val: number) => {
    setCostPerKg(Number(arrobaToKg(val).toFixed(2)));
  };

  const handleApplyLatestBatch = () => {
    if (!latestBatch) return;
    if (latestBatch.costPerKg > 0) {
      setCostPerKg(latestBatch.costPerKg);
    } else if (latestBatch.arrobaPrice > 0) {
      setCostPerKg(Number((latestBatch.arrobaPrice / 15).toFixed(2)));
    }
    if (latestBatch.headsCount > 0 && latestBatch.totalGrossWeightKg > 0) {
      setCarcassWeight(Math.round(latestBatch.totalGrossWeightKg / latestBatch.headsCount));
    }
  };

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

  return (
    <div className="space-y-6">
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
                  Análise Técnica de Rendimento e Desossa do Boi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculadora zootécnica e financeira: apuração do rendimento de cortes nobres, dianteiro, coxão e impacto do descarte (osso e sebo)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {latestBatch && (
              <button
                type="button"
                onClick={handleApplyLatestBatch}
                className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                title={`Assumir valores do último pedido/lote: ${latestBatch.invoiceNumber} (${latestBatch.supplier}) - R$ ${latestBatch.arrobaPrice.toFixed(2)}/@`}
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Assumir Dados do Último Pedido / Lote</span>
              </button>
            )}

            <button
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
          {/* Peso da Carcaça */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Peso da Carcaça / Lote
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                step="5"
                value={carcassWeight}
                onChange={(e) => setCarcassWeight(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Equivale a {(carcassWeight / 15).toFixed(1)} @ (arrobas)
            </span>
          </div>

          {/* Preço de Compra por Kg */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Custo de Compra (R$/kg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                step="0.5"
                value={costPerKg}
                onChange={(e) => setCostPerKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Base da Planilha: R$ 26,00
            </span>
          </div>

          {/* Preço da Arroba correspondente */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Preço da Arroba (R$/@)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="150"
                step="5"
                value={arrobaPrice}
                onChange={(e) => handleArrobaChange(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/@</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              1 @ = 15 kg de carcaça
            </span>
          </div>

          {/* Venda de Sebo */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Recuperação Sebo (R$/kg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={fatPriceKg}
                onChange={(e) => setFatPriceKg(Number(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">R$/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Venda para graxarias
            </span>
          </div>

          {/* Venda de Osso */}
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
              Farinha de osso / ração
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards of Yield */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Custo Efetivo da Carne Limpa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Custo Efetivo Carne Limpa
            </span>
            <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrencyBRL(simulation.effectiveCleanMeatCostPerKg)}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> /kg</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Carcaça: {formatCurrencyBRL(costPerKg)}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 inline" />
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              +{( ((simulation.effectiveCleanMeatCostPerKg - costPerKg) / costPerKg) * 100 ).toFixed(1)}% (impacto osso/sebo)
            </span>
          </div>
        </div>

        {/* Rendimento Carne Limpa vs Descarte */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Aproveitamento de Carne
            </span>
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {((simulation.totalCleanMeatKg / carcassWeight) * 100).toFixed(1)}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {simulation.totalCleanMeatKg} kg carne limpa • {simulation.totalWasteKg} kg descarte ({( (simulation.totalWasteKg / carcassWeight) * 100 ).toFixed(1)}%)
          </div>
        </div>

        {/* Receita Total da Desossa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Faturamento Projetado
            </span>
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrencyBRL(simulation.totalRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Custo: {formatCurrencyBRL(simulation.totalCost)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
              Lucro: {formatCurrencyBRL(simulation.grossProfit)}
            </span>
          </div>
        </div>

        {/* Margem Bruta Geral */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Margem Global
            </span>
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {simulation.globalMarginSalePercent}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">s/ venda</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Markup s/ compra: <strong className="text-slate-700 dark:text-slate-200 font-mono">{simulation.globalMarginCostPercent}%</strong>
          </div>
        </div>
      </div>

      {/* Cuts Detail Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Detalhamento dos Cortes, Custo Equalizado e Margens</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {simulation.cuts.length} itens mapeados na carcaça
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Corte / Subproduto</th>
                <th className="px-3 py-3 text-center">Classificação</th>
                <th className="px-3 py-3 text-right">Rendimento %</th>
                <th className="px-3 py-3 text-right">Peso Obtido (kg)</th>
                <th className="px-3 py-3 text-right">Custo Atribuído (R$/kg)</th>
                <th className="px-3 py-3 text-right">Preço Venda (R$/kg)</th>
                <th className="px-3 py-3 text-right">Faturamento Total</th>
                <th className="px-3 py-3 text-right">Margem s/ Compra (Markup)</th>
                <th className="px-3 py-3 text-right">Margem s/ Venda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {simulation.cuts.map((cut, idx) => {
                const isWaste = cut.isWaste;
                return (
                  <tr 
                    key={idx}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isWaste ? 'bg-rose-50/50 dark:bg-rose-950/10 text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {/* Name */}
                    <td className="px-4 py-2.5 font-sans font-medium flex items-center gap-2">
                      {isWaste ? (
                        <Bone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : cut.category === 'NOBRE' ? (
                        <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                      )}
                      <span className={isWaste ? 'text-rose-700 dark:text-rose-300' : cut.category === 'NOBRE' ? 'text-amber-800 dark:text-amber-300 font-semibold' : ''}>
                        {cut.name}
                      </span>
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
                    <td className="px-3 py-2.5 text-right">
                      {cut.yieldPercent.toFixed(1)}%
                    </td>

                    {/* Peso kg */}
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                      {cut.weightKg.toFixed(2)} kg
                    </td>

                    {/* Custo R$/kg */}
                    <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrencyBRL(cut.costPriceKg)}
                    </td>

                    {/* Preço de venda */}
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyBRL(cut.sellingPriceKg)}
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
                <td className="text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrencyBRL(simulation.totalRevenue)}</td>
                <td className="text-right text-purple-600 dark:text-purple-400">+{simulation.globalMarginCostPercent}%</td>
                <td className="text-right text-purple-600 dark:text-purple-400">{simulation.globalMarginSalePercent}%</td>
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
            <span>Por que o Custo Efetivo da Carne Limpa Sobe?</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Ao comprar 100 kg de carcaça bovina com osso a <strong>R$ 26,00/kg</strong> (investimento de R$ 2.600,00), a desossa gera aproximadamente <strong>17,5 kg de ossos</strong> e <strong>6,5 kg de sebo</strong>. A carne limpa resultante é de cerca de <strong>74,3 kg</strong>.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Como os ossos e o sebo são vendidos para graxaria por um valor muito inferior (R$ 0,70 e R$ 2,10/kg), a diferença de custo é absorvida integralmente pelos cortes comestíveis, elevando o custo real da carne limpa para <strong>R$ 34,70/kg</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            <span>Diferença Entre as Margens no Açougue</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Margem sobre Compra (Markup):</strong> Mede quanto foi adicionado acima do custo de compra da peça. Fórmula: <code className="text-amber-700 dark:text-amber-300 font-mono">(Preço Venda - Custo) / Custo × 100</code>.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            • <strong>Margem sobre Venda (Margem Real):</strong> Mede qual percentual de cada R$ 1,00 vendido no balcão sobra como lucro bruto. Fórmula: <code className="text-emerald-700 dark:text-emerald-300 font-mono">(Preço Venda - Custo) / Preço Venda × 100</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
