import React, { useState, useMemo } from 'react';
import { PurchaseBatch } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { 
  Scale, 
  DollarSign, 
  Bone, 
  Flame, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Scissors, 
  Sparkles, 
  ArrowRight, 
  SlidersHorizontal, 
  X, 
  Layers, 
  ShieldCheck, 
  Boxes, 
  Info,
  RotateCcw
} from 'lucide-react';

interface BatchYieldDrillDownViewProps {
  batch: PurchaseBatch;
  yieldParams?: {
    carcassWeight?: number;
    costPerKg?: number;
    fatPriceKg?: number;
    bonePriceKg?: number;
    breakagePercent?: number;
    targetMargin?: number;
    costFormationMode?: 'VAREJO_PADRAO' | 'COM_GRAXARIA_AUXILIAR';
  };
  onClose?: () => void;
  onApplyBatchToYieldParams?: (batch: PurchaseBatch) => void;
}

export const BatchYieldDrillDownView: React.FC<BatchYieldDrillDownViewProps> = ({
  batch,
  yieldParams,
  onClose,
  onApplyBatchToYieldParams
}) => {
  // Parâmetros do sistema persistidos
  const systemParams = useMemo(() => StorageService.getYieldParams(), []);

  // Parâmetros locais interativos para simulação de impacto no lote
  const [bonePriceKg, setBonePriceKg] = useState<number>(() => {
    return yieldParams?.bonePriceKg ?? systemParams?.bonePriceKg ?? 0.90;
  });

  const [fatPriceKg, setFatPriceKg] = useState<number>(() => {
    return yieldParams?.fatPriceKg ?? systemParams?.fatPriceKg ?? 4.85;
  });

  const [breakagePercent, setBreakagePercent] = useState<number>(() => {
    return yieldParams?.breakagePercent ?? systemParams?.breakagePercent ?? 25.0;
  });

  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  // Dados do Lote
  const headsCount = Math.max(1, batch.headsCount || 1);
  const totalGrossWeightKg = batch.totalGrossWeightKg;
  const costPerKg = batch.costPerKg > 0 ? batch.costPerKg : (batch.arrobaPrice / 15);
  const totalGrossCost = batch.totalCostR$ > 0 ? batch.totalCostR$ : (totalGrossWeightKg * costPerKg);
  const averageWeightPerBoi = Math.round(totalGrossWeightKg / headsCount);

  // Rendimento de Carne Limpa e Quebra Técnica
  const cleanMeatYieldPercent = Math.max(1, 100 - breakagePercent);
  const totalCleanMeatKg = (totalGrossWeightKg * cleanMeatYieldPercent) / 100;
  const totalWasteKg = (totalGrossWeightKg * breakagePercent) / 100;
  const breakageMultiplier = 100 / cleanMeatYieldPercent;

  // 1. Custo Base da Carne Limpa (Antes do Crédito de Subprodutos)
  const baseCleanMeatCostPerKg = totalCleanMeatKg > 0 
    ? totalGrossCost / totalCleanMeatKg 
    : (costPerKg * breakageMultiplier);

  // 2. Subprodutos de Graxaria / Descarte (Composição Padrão de Varejo da Quebra)
  // Osso industrial: ~17.0% do peso da carcaça
  const boneKg = totalGrossWeightKg * 0.170;
  const boneCredit = boneKg * bonePriceKg;
  const boneCreditPerKgClean = totalCleanMeatKg > 0 ? (boneCredit / totalCleanMeatKg) : 0;

  // Sebo industrial: ~6.5% do peso da carcaça
  const fatKg = totalGrossWeightKg * 0.065;
  const fatCredit = fatKg * fatPriceKg;
  const fatCreditPerKgClean = totalCleanMeatKg > 0 ? (fatCredit / totalCleanMeatKg) : 0;

  // Quebra por evaporação e aparas sem valor comercial: ~1.5%
  const trimLossKg = totalGrossWeightKg * 0.015;

  // 3. Crédito Total de Graxaria
  const totalDisposalCredit = boneCredit + fatCredit;
  const graxariaDiscountPerKg = totalCleanMeatKg > 0 ? (totalDisposalCredit / totalCleanMeatKg) : 0;
  const creditPerBoi = totalDisposalCredit / headsCount;

  // 4. O Custo Líquido Efetivo ("Effective Net Cost") por kg de Carne Limpa
  const netCleanCost = totalGrossCost - totalDisposalCredit;
  const effectiveNetCostPerKg = totalCleanMeatKg > 0 ? (netCleanCost / totalCleanMeatKg) : costPerKg;
  
  // Economia percentual gerada pelo aproveitamento de osso/sebo
  const savingsPercent = baseCleanMeatCostPerKg > 0 
    ? ((baseCleanMeatCostPerKg - effectiveNetCostPerKg) / baseCleanMeatCostPerKg) * 100 
    : 0;

  // 5. Decomposição das 4 Mesas Primárias com base no Custo Efetivo do Lote
  const primaryMesasBreakdown = [
    {
      alias: 'PEÇA DIANTEIRO',
      percent: 39.0,
      factor: 0.81,
      costCarcass: costPerKg * 0.81,
      effectiveNetCost: effectiveNetCostPerKg * 0.81,
      weightKg: totalGrossWeightKg * 0.39,
      cuts: 'Paleta, Acém, Peito e Músculo'
    },
    {
      alias: 'PEÇA TRAZEIRO',
      percent: 48.0,
      factor: 1.246,
      costCarcass: costPerKg * 1.246,
      effectiveNetCost: effectiveNetCostPerKg * 1.246,
      weightKg: totalGrossWeightKg * 0.48,
      cuts: 'Traseiro Especial (Alcatrão + Coxão)'
    },
    {
      alias: 'PEÇA COXAO',
      percent: 30.0,
      factor: 1.16,
      costCarcass: costPerKg * 1.16,
      effectiveNetCost: effectiveNetCostPerKg * 1.16,
      weightKg: totalGrossWeightKg * 0.30,
      cuts: 'Chã de Dentro, Chã de Fora, Patinho, Lagarto'
    },
    {
      alias: 'PEÇA ALCATRAO',
      percent: 18.0,
      factor: 1.39,
      costCarcass: costPerKg * 1.39,
      effectiveNetCost: effectiveNetCostPerKg * 1.39,
      weightKg: totalGrossWeightKg * 0.18,
      cuts: 'Picanha, Filé Mignon, Alcatra e Contra Filé'
    }
  ];

  const handleApplyToYield = () => {
    if (onApplyBatchToYieldParams) {
      onApplyBatchToYieldParams(batch);
    } else {
      const updated = {
        ...systemParams,
        carcassWeight: averageWeightPerBoi,
        costPerKg: Number(costPerKg.toFixed(2)),
        fatPriceKg: Number(fatPriceKg.toFixed(2)),
        bonePriceKg: Number(bonePriceKg.toFixed(2)),
        breakagePercent: Number(breakagePercent.toFixed(1))
      };
      StorageService.saveYieldParams(updated);
    }
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 3500);
  };

  const handleResetParameters = () => {
    setBonePriceKg(systemParams?.bonePriceKg ?? 0.90);
    setFatPriceKg(systemParams?.fatPriceKg ?? 4.85);
    setBreakagePercent(systemParams?.breakagePercent ?? 25.0);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0d2a1f] to-slate-950 text-white rounded-2xl p-5 shadow-2xl border-2 border-emerald-500/40 animate-fadeIn my-3">
      
      {/* 1. Header do Drill-Down */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner shrink-0">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 font-mono shadow-xs">
                DRILL-DOWN • APURAÇÃO EFETIVA DE CUSTO
              </span>
              <span className="text-xs font-bold text-emerald-300 font-mono">
                {batch.invoiceNumber} • {batch.supplier}
              </span>
              <span className="text-[11px] text-slate-400">
                ({batch.headsCount} cabeças • {formatNumberBR(batch.totalGrossWeightKg, 0)} kg total • Méd: {averageWeightPerBoi} kg/boi)
              </span>
            </div>
            <h4 className="text-base font-black text-white tracking-tight mt-1">
              Desdobramento de Custos com Parâmetros de Rendimento (Yield Parameters)
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl leading-relaxed">
              Demonstrativo analítico do impacto da quebra técnica e recuperação de subprodutos (venda de osso e sebo) para apuração do <strong>Custo Líquido Efetivo (Effective Net Cost)</strong> por kg de carne limpa.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleApplyToYield}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="Sincroniza os parâmetros deste lote na aba de Rendimento e Desossa (YieldTab)"
          >
            {appliedNotification ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Sincronizado no ERP!</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Carregar no Módulo Desossa</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Fechar detalhamento"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Parâmetros Ativos de Rendimento (Yield Parameters) com Simulação Interativa */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">
              Parâmetros Técnicos de Rendimento Aplicados a este Lote:
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetParameters}
            className="text-[11px] text-slate-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            title="Restaurar valores padrão do ERP"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Padrão do Sistema</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Cotação do Osso */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Bone className="w-3.5 h-3.5 text-rose-400" />
                <span>Preço Osso (Rendering)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">~17% Carcaça</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono text-xs">R$</span>
              <input
                type="number"
                step="0.05"
                min="0.10"
                value={bonePriceKg}
                onChange={(e) => setBonePriceKg(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[11px] text-slate-400">/kg</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-1 font-mono">
              Gera +{formatCurrencyBRL(boneCredit)} no lote
            </span>
          </div>

          {/* Cotação do Sebo */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Preço Sebo (Graxaria)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">~6.5% Carcaça</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono text-xs">R$</span>
              <input
                type="number"
                step="0.05"
                min="0.50"
                value={fatPriceKg}
                onChange={(e) => setFatPriceKg(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[11px] text-slate-400">/kg</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-1 font-mono">
              Gera +{formatCurrencyBRL(fatCredit)} no lote
            </span>
          </div>

          {/* Quebra Técnica */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-rose-400" />
                <span>Quebra Técnica (%)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Padrão 25%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.5"
                min="15"
                max="35"
                value={breakagePercent}
                onChange={(e) => setBreakagePercent(Number(e.target.value) || 25.0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-400"
              />
              <span className="text-[11px] text-rose-400 font-bold">%</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              Fator quebra: {breakageMultiplier.toFixed(4)}x (+{( (breakageMultiplier - 1) * 100 ).toFixed(1)}%)
            </span>
          </div>

          {/* Rendimento Carne Limpa */}
          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Carne Limpa Útil</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">{cleanMeatYieldPercent.toFixed(1)}%</span>
            </div>
            <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
              {formatNumberBR(totalCleanMeatKg, 1)} kg
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              Quebra total: {formatNumberBR(totalWasteKg, 1)} kg
            </span>
          </div>
        </div>
      </div>

      {/* 3. OS 4 CARDS DESTAQUE DE CUSTO (O CUSTO EFETIVO LÍQUIDO EM EVIDÊNCIA) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Custo Carcaça c/ Osso (Compra) */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              1. Custo Carcaça c/ Osso (Compra)
            </span>
            <div className="text-2xl font-black font-mono text-slate-200 mt-1">
              {formatCurrencyBRL(costPerKg)}
              <span className="text-xs font-normal text-slate-400">/kg</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
              Equivale a R$ {batch.arrobaPrice.toFixed(2)}/@
            </span>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 mt-2">
            Investimento Total: <strong className="text-white font-mono">{formatCurrencyBRL(totalGrossCost)}</strong>
          </div>
        </div>

        {/* Card 2: Custo Base da Carne Limpa (Sem Graxaria) */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-400 block">
              2. Custo Base Carne Limpa (s/ Crédito)
            </span>
            <div className="text-2xl font-black font-mono text-rose-300 mt-1">
              {formatCurrencyBRL(baseCleanMeatCostPerKg)}
              <span className="text-xs font-normal text-slate-400">/kg limpo</span>
            </div>
            <span className="text-[11px] font-mono text-rose-400 mt-0.5 block font-bold">
              +{formatCurrencyBRL(baseCleanMeatCostPerKg - costPerKg)}/kg pela quebra ({breakagePercent.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 mt-2">
            Fator Quebra Varejo: <strong className="text-slate-200 font-mono">{breakageMultiplier.toFixed(4)}x</strong>
          </div>
        </div>

        {/* Card 3: Abatimento de Graxaria (Osso + Sebo) */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              3. Crédito Subprodutos (Graxaria)
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              -{formatCurrencyBRL(graxariaDiscountPerKg)}
              <span className="text-xs font-normal text-slate-400">/kg abatido</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-300 mt-0.5 block">
              Total Recuperado: +{formatCurrencyBRL(totalDisposalCredit)}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 mt-2">
            Retorno por Boi: <strong className="text-emerald-400 font-mono">+{formatCurrencyBRL(creditPerBoi)}/cabeça</strong>
          </div>
        </div>

        {/* Card 4: EFFECTIVE NET COST (O Indicador Solicitado) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-900 border-2 border-emerald-400 shadow-lg flex flex-col justify-between ring-1 ring-emerald-400/50">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200 block">
                4. CUSTO LÍQUIDO EFETIVO (NET COST)
              </span>
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-3xl font-black font-mono text-emerald-300 mt-1">
              {formatCurrencyBRL(effectiveNetCostPerKg)}
              <span className="text-xs font-normal text-emerald-200">/kg útil</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-200 mt-1 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-300" />
              <span>Economia: {formatCurrencyBRL(graxariaDiscountPerKg)}/kg (-{savingsPercent.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="text-[11px] text-emerald-100 pt-2 border-t border-emerald-500/40 mt-2">
            Custo Total Líquido Lote: <strong className="text-white font-mono">{formatCurrencyBRL(netCleanCost)}</strong>
          </div>
        </div>

      </div>

      {/* 4. TABELA DE CÁLCULO DETALHADA: DRILL-DOWN DO IMPACTO DOS PARÂMETROS */}
      <div className="mt-5 bg-slate-950 rounded-xl border border-emerald-500/30 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tabela de Cálculo: Decomposição do Custo da Carcaça até a Carne Limpa
            </h5>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            Base: {formatNumberBR(totalGrossWeightKg, 0)} kg ({headsCount} bois) @ R$ {costPerKg.toFixed(2)}/kg
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Etapa / Componente da Desossa</th>
                <th className="px-3 py-2.5 text-center">% Carcaça</th>
                <th className="px-3 py-2.5 text-right">Peso no Lote (kg)</th>
                <th className="px-3 py-2.5 text-right">Preço Unitário (R$/kg)</th>
                <th className="px-3 py-2.5 text-right">Impacto Financeiro (R$)</th>
                <th className="px-3 py-2.5 text-right">Custo / Abatimento s/ Carne Limpa</th>
                <th className="px-3 py-2.5 text-center">Natureza Contábil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono text-xs">
              
              {/* Linha 1: Compra Carcaça com Osso */}
              <tr className="bg-slate-950 hover:bg-slate-900/60">
                <td className="px-4 py-2.5 font-sans font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span>Carcaça com Osso (Boi Casado)</span>
                </td>
                <td className="px-3 py-2.5 text-center text-slate-300">100.0%</td>
                <td className="px-3 py-2.5 text-right text-slate-200 font-bold">{formatNumberBR(totalGrossWeightKg, 1)} kg</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{formatCurrencyBRL(costPerKg)}</td>
                <td className="px-3 py-2.5 text-right text-white font-bold">{formatCurrencyBRL(totalGrossCost)}</td>
                <td className="px-3 py-2.5 text-right text-slate-400">Ponto de Partida</td>
                <td className="px-3 py-2.5 text-center font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                    Custo Aquisição
                  </span>
                </td>
              </tr>

              {/* Linha 2: Quebra Técnica */}
              <tr className="bg-rose-950/20 hover:bg-rose-950/30 text-rose-200">
                <td className="px-4 py-2.5 font-sans font-semibold flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Quebra Técnica de Desossa (Perda de Peso)</span>
                </td>
                <td className="px-3 py-2.5 text-center font-bold text-rose-400">-{breakagePercent.toFixed(1)}%</td>
                <td className="px-3 py-2.5 text-right font-bold text-rose-300">-{formatNumberBR(totalWasteKg, 1)} kg</td>
                <td className="px-3 py-2.5 text-right text-rose-400 font-mono">Fator {breakageMultiplier.toFixed(4)}x</td>
                <td className="px-3 py-2.5 text-right text-rose-400 font-mono">Perda Fisiológica</td>
                <td className="px-3 py-2.5 text-right font-bold text-rose-300">
                  +{formatCurrencyBRL(baseCleanMeatCostPerKg - costPerKg)}/kg
                </td>
                <td className="px-3 py-2.5 text-center font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-900/60 text-rose-300 font-bold border border-rose-700/50">
                    Elevação de Custo
                  </span>
                </td>
              </tr>

              {/* Linha 3: Custo Base da Carne Limpa */}
              <tr className="bg-amber-950/20 hover:bg-amber-950/30 text-amber-200 font-semibold border-t-2 border-slate-800">
                <td className="px-4 py-2.5 font-sans font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span>Custo Base da Carne Limpa (Sem Graxaria)</span>
                </td>
                <td className="px-3 py-2.5 text-center font-bold text-amber-400">{cleanMeatYieldPercent.toFixed(1)}%</td>
                <td className="px-3 py-2.5 text-right font-bold text-white">{formatNumberBR(totalCleanMeatKg, 1)} kg</td>
                <td className="px-3 py-2.5 text-right font-black text-amber-300">{formatCurrencyBRL(baseCleanMeatCostPerKg)}</td>
                <td className="px-3 py-2.5 text-right text-white font-bold">{formatCurrencyBRL(totalGrossCost)}</td>
                <td className="px-3 py-2.5 text-right text-amber-300 font-black">{formatCurrencyBRL(baseCleanMeatCostPerKg)}/kg</td>
                <td className="px-3 py-2.5 text-center font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-900/60 text-amber-300 font-bold border border-amber-700/50">
                    Base Varejo
                  </span>
                </td>
              </tr>

              {/* Linha 4: Osso Industrial */}
              <tr className="bg-emerald-950/15 hover:bg-emerald-950/25 text-emerald-200">
                <td className="px-4 py-2.5 font-sans font-medium flex items-center gap-2 pl-6">
                  <Bone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Subproduto: Osso Industrial (Rendering FCO)</span>
                </td>
                <td className="px-3 py-2.5 text-center text-slate-400">17.0%</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{formatNumberBR(boneKg, 1)} kg</td>
                <td className="px-3 py-2.5 text-right text-emerald-400">{formatCurrencyBRL(bonePriceKg)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-400">+{formatCurrencyBRL(boneCredit)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-400">-{formatCurrencyBRL(boneCreditPerKgClean)}/kg</td>
                <td className="px-3 py-2.5 text-center font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/40">
                    Crédito Graxaria
                  </span>
                </td>
              </tr>

              {/* Linha 5: Sebo Industrial */}
              <tr className="bg-emerald-950/15 hover:bg-emerald-950/25 text-emerald-200">
                <td className="px-4 py-2.5 font-sans font-medium flex items-center gap-2 pl-6">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Subproduto: Sebo Industrial (Graxaria)</span>
                </td>
                <td className="px-3 py-2.5 text-center text-slate-400">6.5%</td>
                <td className="px-3 py-2.5 text-right text-slate-300">{formatNumberBR(fatKg, 1)} kg</td>
                <td className="px-3 py-2.5 text-right text-emerald-400">{formatCurrencyBRL(fatPriceKg)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-400">+{formatCurrencyBRL(fatCredit)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-400">-{formatCurrencyBRL(fatCreditPerKgClean)}/kg</td>
                <td className="px-3 py-2.5 text-center font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700/40">
                    Crédito Graxaria
                  </span>
                </td>
              </tr>

              {/* Linha 6: Quebra Residual */}
              <tr className="bg-slate-950 hover:bg-slate-900/60 text-slate-400">
                <td className="px-4 py-2.5 font-sans font-medium flex items-center gap-2 pl-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                  <span>Aparas, Serragem & Evaporação</span>
                </td>
                <td className="px-3 py-2.5 text-center">1.5%</td>
                <td className="px-3 py-2.5 text-right">{formatNumberBR(trimLossKg, 1)} kg</td>
                <td className="px-3 py-2.5 text-right">R$ 0,00</td>
                <td className="px-3 py-2.5 text-right">R$ 0,00</td>
                <td className="px-3 py-2.5 text-right">R$ 0,00</td>
                <td className="px-3 py-2.5 text-center font-sans">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    Descarte Técnico
                  </span>
                </td>
              </tr>

              {/* Linha 7: EFFECTIVE NET COST (TOTALIZADOR) */}
              <tr className="bg-emerald-950/70 hover:bg-emerald-950 font-bold border-t-2 border-emerald-400 text-white text-sm">
                <td className="px-4 py-3 font-sans font-black flex items-center gap-2 text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>CUSTO LÍQUIDO EFETIVO (EFFECTIVE NET COST)</span>
                </td>
                <td className="px-3 py-3 text-center text-emerald-400">{cleanMeatYieldPercent.toFixed(1)}%</td>
                <td className="px-3 py-3 text-right font-black text-white">{formatNumberBR(totalCleanMeatKg, 1)} kg</td>
                <td className="px-3 py-3 text-right font-mono text-emerald-300 text-xs">
                  -{formatCurrencyBRL(graxariaDiscountPerKg)} crédito
                </td>
                <td className="px-3 py-3 text-right font-black text-white">{formatCurrencyBRL(netCleanCost)}</td>
                <td className="px-3 py-3 text-right font-black text-emerald-300 text-base">
                  {formatCurrencyBRL(effectiveNetCostPerKg)}/kg
                </td>
                <td className="px-3 py-3 text-center font-sans">
                  <span className="px-2.5 py-1 rounded-md text-[10px] bg-emerald-600 text-slate-950 font-black shadow-xs">
                    EFETIVO LÍQUIDO
                  </span>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DESDOBRAMENTO NAS 4 MESAS PRIMÁRIAS DE CORTE */}
      <div className="mt-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Boxes className="w-4 h-4 text-amber-400" />
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Impacto do Custo Efetivo deste Lote nas 4 Mesas Frigoríficas Primárias
          </h5>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {primaryMesasBreakdown.map((mesa, idx) => (
            <div key={idx} className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-amber-400">{mesa.percent.toFixed(1)}% Carcaça</span>
                  <span className="text-slate-400">Fator: {mesa.factor}x</span>
                </div>
                <h6 className="text-xs font-black text-white font-sans">{mesa.alias}</h6>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{mesa.cuts}</p>

                <div className="mt-2.5 p-2 rounded bg-slate-900 border border-slate-800 space-y-1 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Custo Carcaça:</span>
                    <strong className="text-slate-300">{formatCurrencyBRL(mesa.costCarcass)}/kg</strong>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-slate-800">
                    <span className="font-sans font-bold">Custo Efetivo Limpo:</span>
                    <strong className="font-bold text-xs">{formatCurrencyBRL(mesa.effectiveNetCost)}/kg</strong>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-850 mt-2 font-mono flex items-center justify-between">
                <span>Volume no Lote:</span>
                <strong className="text-white">{formatNumberBR(mesa.weightKg, 0)} kg</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
