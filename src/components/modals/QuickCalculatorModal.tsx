import React, { useState } from 'react';
import { simulateBeefYield, formatCurrencyBRL } from '../../services/calculationService';
import { Calculator, X, Scale, Scissors, TrendingUp, DollarSign, Database, CheckCircle2 } from 'lucide-react';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [carcassWeight, setCarcassWeight] = useState(240);
  const [costKg, setCostKg] = useState(26.00);

  if (!isOpen) return null;

  const sim = simulateBeefYield(carcassWeight, costKg);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-in transition-colors text-slate-900 dark:text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Apuração Rápida de Desossa do Boi</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                  <Database className="w-2.5 h-2.5" />
                  Base Real ERP
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cálculo de custo efetivo limpo e margens com base nos produtos cadastrados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Peso da Carcaça / Lote (Kg)
            </label>
            <input
              type="number"
              value={carcassWeight}
              onChange={(e) => setCarcassWeight(Number(e.target.value) || 0)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono text-sm"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Custo de Compra Carcaça (R$/kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={costKg}
              onChange={(e) => setCostKg(Number(e.target.value) || 0)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono text-sm"
            />
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Custo Limpo</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrencyBRL(sim.effectiveCleanMeatCostPerKg)}/kg
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Carne Limpa</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {sim.totalCleanMeatKg} kg
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Descarte (Osso/Sebo)</span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
              {sim.totalWasteKg} kg
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Margem Venda</span>
            <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono">
              {sim.globalMarginSalePercent}%
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-xs text-slate-700 dark:text-slate-300">
          <p>
            <strong>Equalização com a Base Real:</strong> Com a carcaça comprada a {formatCurrencyBRL(costKg)}/kg, o ponto de equilíbrio da carne limpa atinge <strong className="text-amber-700 dark:text-amber-400">{formatCurrencyBRL(sim.effectiveCleanMeatCostPerKg)}/kg</strong>. O faturamento apurado com os preços da tabela de produtos do ERP alcança <strong className="text-slate-900 dark:text-white">{formatCurrencyBRL(sim.totalRevenue)}</strong> gerando lucro de <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrencyBRL(sim.grossProfit)}</strong>.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
