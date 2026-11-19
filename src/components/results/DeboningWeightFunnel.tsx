import React, { useState, useMemo } from 'react';
import { SheetRowData, Store, PurchaseBatch, WasteRecord } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import {
  Scale,
  ArrowDown,
  RotateCcw,
  PackageCheck,
  TrendingDown,
  Beef,
  Bone,
  Building2,
  SlidersHorizontal
} from 'lucide-react';

interface DeboningWeightFunnelProps {
  rows: SheetRowData[];
  stores: Store[];
  batches?: PurchaseBatch[];
  wasteRecords?: WasteRecord[];
  selectedStoreId: string;
  periodLabel: string;
  yieldParams: {
    carcassWeight: number;
    costPerKg: number;
    fatPriceKg: number;
    bonePriceKg: number;
    targetMargin: number;
    breakagePercent?: number;
    basis: 'carcass' | 'piece';
  };
}

interface FunnelStage {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  weightKg: number;
  pctOfLiveWeight: number;
  pctOfCarcass: number;
  kgPerHead: number;
  lossBeforeKg: number;
  lossBeforePctOfLive: number;
  lossBeforeLabel: string;
  lossCategory: 'abate' | 'camara' | 'osso_sebo' | 'embalagem' | 'entrada';
  recoveredValueR$?: number;
  barColor: string;
  barBorder: string;
  textColor: string;
}

export const DeboningWeightFunnel: React.FC<DeboningWeightFunnelProps> = ({
  rows,
  stores,
  batches = [],
  wasteRecords = [],
  selectedStoreId,
  periodLabel,
  yieldParams
}) => {
  // Parâmetros técnicos zootécnicos e operacionais ajustáveis pelo gestor
  const [carcassYieldPct, setCarcassYieldPct] = useState<number>(54.0); // Padrão Boi Gordo: 54% (Vivo -> Carcaça)
  const [coolingLossPct, setCoolingLossPct] = useState<number>(1.5);   // Quebra de gancho / resfriamento em câmara
  const [packagingTrimPct, setPackagingTrimPct] = useState<number>(2.5); // Refile final, exsudato e ajuste de bandeja/vácuo
  const [activeStageId, setActiveStageId] = useState<string>('packaged');

  const handleResetTechnicalDefaults = () => {
    setCarcassYieldPct(54.0);
    setCoolingLossPct(1.5);
    setPackagingTrimPct(2.5);
  };

  // Cálculo consolidado do funil para o escopo (Todas ou Filial específica) e período selecionado
  const funnelModel = useMemo(() => {
    const isSingleStore = selectedStoreId !== 'TODAS';
    const activeRows = isSingleStore ? rows.filter(r => r.storeId === selectedStoreId) : rows;
    const activeWaste = isSingleStore ? wasteRecords.filter(w => w.storeId === selectedStoreId) : wasteRecords;

    let totalCarcassKg = 0;
    let totalHeads = 0;
    let totalCarcassCostR$ = 0;

    if (isSingleStore) {
      const storeBatchItems = batches.flatMap(b => b.items || []).filter(it => it.storeId === selectedStoreId);
      if (storeBatchItems.length > 0) {
        totalCarcassKg = storeBatchItems.reduce((acc, it) => acc + (it.estimatedWeightKg || 0), 0);
        totalHeads = storeBatchItems.reduce((acc, it) => acc + (it.pedido || 0), 0);
        totalCarcassCostR$ = storeBatchItems.reduce((acc, it) => acc + (it.estimatedTotalR$ || 0), 0);
      } else {
        const targetRow = rows.find(r => r.storeId === selectedStoreId);
        totalHeads = targetRow
          ? (targetRow.pedidoFinal !== undefined && targetRow.pedidoFinal > 0 ? targetRow.pedidoFinal : (targetRow.boi || 0))
          : 0;
        totalCarcassKg = totalHeads * yieldParams.carcassWeight;
        totalCarcassCostR$ = totalCarcassKg * yieldParams.costPerKg;
      }
    } else {
      if (batches.length > 0) {
        totalCarcassKg = batches.reduce((acc, b) => acc + (b.totalGrossWeightKg || 0), 0);
        totalHeads = batches.reduce((acc, b) => acc + (b.headsCount || 0), 0);
        totalCarcassCostR$ = batches.reduce((acc, b) => acc + (b.totalCostR$ || 0), 0);
      } else {
        totalHeads = activeRows.reduce(
          (acc, r) => acc + (r.pedidoFinal !== undefined && r.pedidoFinal > 0 ? r.pedidoFinal : (r.boi || 0)),
          0
        );
        totalCarcassKg = totalHeads * yieldParams.carcassWeight;
        totalCarcassCostR$ = totalCarcassKg * yieldParams.costPerKg;
      }
    }

    // Fallback seguro caso não haja cabeças zeradas para manter proporções de 1 boi padrão na visualização
    const hasOperationalVolume = totalCarcassKg > 0;
    const effectiveCarcassKg = hasOperationalVolume ? totalCarcassKg : yieldParams.carcassWeight;
    const effectiveHeads = totalHeads > 0 ? totalHeads : Math.max(1, effectiveCarcassKg / (yieldParams.carcassWeight || 240));
    const effectiveCostR$ = hasOperationalVolume ? totalCarcassCostR$ : effectiveCarcassKg * yieldParams.costPerKg;

    // 1. Peso Vivo de Entrada (100% da massa animal)
    const liveWeightKg = carcassYieldPct > 0 ? effectiveCarcassKg / (carcassYieldPct / 100) : effectiveCarcassKg / 0.54;
    const slaughterLossKg = Math.max(0, liveWeightKg - effectiveCarcassKg);

    // 2. Perda em Câmara Fria (desidratação no gancho)
    const coolingLossKg = effectiveCarcassKg * (coolingLossPct / 100);
    const carcassAfterCoolingKg = Math.max(0, effectiveCarcassKg - coolingLossKg);

    // 3. Descarte de Osso e Sebo na Desossa (usa lançamentos reais de Graxaria se existirem no período; senão padrão 17,5% osso + 6,5% sebo)
    const hasRealWaste = activeWaste.length > 0;
    let boneLossKg = 0;
    let fatLossKg = 0;
    let wasteRecoveredR$ = 0;

    if (hasRealWaste) {
      boneLossKg = activeWaste.reduce((acc, w) => acc + (w.boneWeightKg || 0), 0);
      fatLossKg = activeWaste.reduce((acc, w) => acc + (w.fatWeightKg || 0), 0);
      wasteRecoveredR$ = activeWaste.reduce((acc, w) => acc + (w.boneRevenueR$ || 0) + (w.fatRevenueR$ || 0), 0);
      // Caso o registro de graxaria seja parcial (<10% da carcaça), protege para não distorcer a física do boi
      if (boneLossKg + fatLossKg > effectiveCarcassKg * 0.45) {
        const scale = (effectiveCarcassKg * 0.24) / (boneLossKg + fatLossKg);
        boneLossKg *= scale;
        fatLossKg *= scale;
      }
    } else {
      boneLossKg = effectiveCarcassKg * 0.175;
      fatLossKg = effectiveCarcassKg * 0.065;
      wasteRecoveredR$ = boneLossKg * yieldParams.bonePriceKg + fatLossKg * yieldParams.fatPriceKg;
    }

    const totalBoneFatKg = boneLossKg + fatLossKg;
    const cleanDebonedKg = Math.max(0, carcassAfterCoolingKg - totalBoneFatKg);

    // 4. Perda de Refile, Exsudato e Acabamento de Embalagem (Vácuo / Bandeja)
    const packagingLossKg = cleanDebonedKg * (packagingTrimPct / 100);
    const finalPackagedKg = Math.max(0, cleanDebonedKg - packagingLossKg);

    // Métricas consolidadas de rendimento e perda
    const totalWeightLostFromLiveKg = Math.max(0, liveWeightKg - finalPackagedKg);
    const totalDeboningLossKg = Math.max(0, effectiveCarcassKg - finalPackagedKg);

    const finalYieldOnLivePct = liveWeightKg > 0 ? (finalPackagedKg / liveWeightKg) * 100 : 0;
    const finalYieldOnCarcassPct = effectiveCarcassKg > 0 ? (finalPackagedKg / effectiveCarcassKg) * 100 : 0;
    const deboningLossOnCarcassPct = effectiveCarcassKg > 0 ? (totalDeboningLossKg / effectiveCarcassKg) * 100 : 0;
    const totalLossFromLivePct = liveWeightKg > 0 ? (totalWeightLostFromLiveKg / liveWeightKg) * 100 : 0;

    // Custo por kg ao longo da transformação
    const costPerKgLive = liveWeightKg > 0 ? effectiveCostR$ / liveWeightKg : 0;
    const costPerKgCarcass = effectiveCarcassKg > 0 ? effectiveCostR$ / effectiveCarcassKg : 0;
    const netCostAfterWasteR$ = Math.max(0, effectiveCostR$ - wasteRecoveredR$);
    const costPerKgPackagedGross = finalPackagedKg > 0 ? effectiveCostR$ / finalPackagedKg : 0;
    const costPerKgPackagedNet = finalPackagedKg > 0 ? netCostAfterWasteR$ / finalPackagedKg : 0;

    const stages: FunnelStage[] = [
      {
        id: 'live',
        stepNumber: 1,
        title: 'Peso Vivo de Entrada (Animal em Pé)',
        subtitle: `Base zootécnica (${formatNumberBR(carcassYieldPct, 1)}% rendimento de carcaça)`,
        weightKg: liveWeightKg,
        pctOfLiveWeight: 100,
        pctOfCarcass: liveWeightKg > 0 ? (liveWeightKg / effectiveCarcassKg) * 100 : 0,
        kgPerHead: liveWeightKg / effectiveHeads,
        lossBeforeKg: 0,
        lossBeforePctOfLive: 0,
        lossBeforeLabel: 'Entrada Bruta',
        lossCategory: 'entrada',
        barColor: 'bg-slate-800 dark:bg-slate-700',
        barBorder: 'border-slate-700 dark:border-slate-600',
        textColor: 'text-white'
      },
      {
        id: 'carcass',
        stepNumber: 2,
        title: 'Carcaça c/ Osso Recebida (Boi Casado)',
        subtitle: 'Peso faturado na entrada da câmara fria após abate',
        weightKg: effectiveCarcassKg,
        pctOfLiveWeight: liveWeightKg > 0 ? (effectiveCarcassKg / liveWeightKg) * 100 : 0,
        pctOfCarcass: 100,
        kgPerHead: effectiveCarcassKg / effectiveHeads,
        lossBeforeKg: slaughterLossKg,
        lossBeforePctOfLive: liveWeightKg > 0 ? (slaughterLossKg / liveWeightKg) * 100 : 0,
        lossBeforeLabel: 'Perda de Abate (Couro, Cabeça, Vísceras & Sangue)',
        lossCategory: 'abate',
        barColor: 'bg-blue-700 dark:bg-blue-800',
        barBorder: 'border-blue-600 dark:border-blue-700',
        textColor: 'text-white'
      },
      {
        id: 'cooled',
        stepNumber: 3,
        title: 'Carcaça Resfriada Pronta p/ Mesa',
        subtitle: 'Após quebra fisiológica de gotejamento e resfriamento no gancho',
        weightKg: carcassAfterCoolingKg,
        pctOfLiveWeight: liveWeightKg > 0 ? (carcassAfterCoolingKg / liveWeightKg) * 100 : 0,
        pctOfCarcass: effectiveCarcassKg > 0 ? (carcassAfterCoolingKg / effectiveCarcassKg) * 100 : 0,
        kgPerHead: carcassAfterCoolingKg / effectiveHeads,
        lossBeforeKg: coolingLossKg,
        lossBeforePctOfLive: liveWeightKg > 0 ? (coolingLossKg / liveWeightKg) * 100 : 0,
        lossBeforeLabel: `Quebra em Câmara Fria / Desidratação (${formatNumberBR(coolingLossPct, 1)}%)`,
        lossCategory: 'camara',
        barColor: 'bg-sky-600 dark:bg-sky-700',
        barBorder: 'border-sky-500 dark:border-sky-600',
        textColor: 'text-white'
      },
      {
        id: 'deboned',
        stepNumber: 4,
        title: 'Carne Limpa Desossada na Mesa',
        subtitle: hasRealWaste
          ? `Abatendo ${formatNumberBR(boneLossKg, 0)} kg osso + ${formatNumberBR(fatLossKg, 0)} kg sebo (Graxaria real)`
          : 'Abatendo osso estrutural (17,5%) e sebo/pelanca de desossa (6,5%)',
        weightKg: cleanDebonedKg,
        pctOfLiveWeight: liveWeightKg > 0 ? (cleanDebonedKg / liveWeightKg) * 100 : 0,
        pctOfCarcass: effectiveCarcassKg > 0 ? (cleanDebonedKg / effectiveCarcassKg) * 100 : 0,
        kgPerHead: cleanDebonedKg / effectiveHeads,
        lossBeforeKg: totalBoneFatKg,
        lossBeforePctOfLive: liveWeightKg > 0 ? (totalBoneFatKg / liveWeightKg) * 100 : 0,
        lossBeforeLabel: `Descarte na Desossa: Osso (${formatNumberBR(boneLossKg, 0)} kg) + Sebo (${formatNumberBR(fatLossKg, 0)} kg)`,
        lossCategory: 'osso_sebo',
        recoveredValueR$: wasteRecoveredR$,
        barColor: 'bg-amber-600 dark:bg-amber-700',
        barBorder: 'border-amber-500 dark:border-amber-600',
        textColor: 'text-white'
      },
      {
        id: 'packaged',
        stepNumber: 5,
        title: 'Carne Embalada Final (Líquida p/ Venda)',
        subtitle: 'Peso final líquido após refile de acabamento, vácuo e bandeja',
        weightKg: finalPackagedKg,
        pctOfLiveWeight: finalYieldOnLivePct,
        pctOfCarcass: finalYieldOnCarcassPct,
        kgPerHead: finalPackagedKg / effectiveHeads,
        lossBeforeKg: packagingLossKg,
        lossBeforePctOfLive: liveWeightKg > 0 ? (packagingLossKg / liveWeightKg) * 100 : 0,
        lossBeforeLabel: `Refile Final, Exsudato & Quebra de Embalagem (${formatNumberBR(packagingTrimPct, 1)}%)`,
        lossCategory: 'embalagem',
        barColor: 'bg-emerald-600 dark:bg-emerald-700',
        barBorder: 'border-emerald-500 dark:border-emerald-600',
        textColor: 'text-white'
      }
    ];

    // Distribuição dos cortes embalados finais por família de mesa (proporções zootécnicas sobre a carne limpa)
    const cutFamilies = [
      {
        id: 'alcatrao',
        name: 'Alcatrão / Cortes Nobres',
        cuts: 'Picanha, Filé Mignon, Contra Filé, Alcatra',
        shareOfPackagedPct: 21.6,
        kg: finalPackagedKg * 0.216,
        color: 'bg-emerald-600'
      },
      {
        id: 'coxao',
        name: 'Mesa de Coxão (Traseiro)',
        cuts: 'Chã de Dentro, Patinho, Lagarto Redondo, Coxão Duro',
        shareOfPackagedPct: 30.7,
        kg: finalPackagedKg * 0.307,
        color: 'bg-blue-600'
      },
      {
        id: 'dianteiro',
        name: 'Mesa de Dianteiro',
        cuts: 'Acém, Paleta, Peito Bovino, Músculo',
        shareOfPackagedPct: 40.0,
        kg: finalPackagedKg * 0.400,
        color: 'bg-amber-600'
      },
      {
        id: 'costela',
        name: 'Ponta de Agulha / Costela',
        cuts: 'Costela Gaúcha e Entrecosto',
        shareOfPackagedPct: 7.7,
        kg: finalPackagedKg * 0.077,
        color: 'bg-rose-600'
      }
    ];

    return {
      hasOperationalVolume,
      effectiveHeads,
      liveWeightKg,
      effectiveCarcassKg,
      coolingLossKg,
      boneLossKg,
      fatLossKg,
      totalBoneFatKg,
      cleanDebonedKg,
      packagingLossKg,
      finalPackagedKg,
      totalWeightLostFromLiveKg,
      totalDeboningLossKg,
      finalYieldOnLivePct,
      finalYieldOnCarcassPct,
      deboningLossOnCarcassPct,
      totalLossFromLivePct,
      wasteRecoveredR$,
      effectiveCostR$,
      costPerKgLive,
      costPerKgCarcass,
      costPerKgPackagedGross,
      costPerKgPackagedNet,
      hasRealWaste,
      stages,
      cutFamilies
    };
  }, [rows, batches, wasteRecords, selectedStoreId, yieldParams, carcassYieldPct, coolingLossPct, packagingTrimPct]);

  // Detalhamento do funil por filial (para comparação entre as 16 lojas)
  const storeFunnelRows = useMemo(() => {
    const targetRows = selectedStoreId === 'TODAS' ? rows : rows.filter(r => r.storeId === selectedStoreId);

    return targetRows.map((row) => {
      const store = stores.find(s => s.id === row.storeId);
      const storeBatchItems = batches.flatMap(b => b.items || []).filter(it => it.storeId === row.storeId);

      let carcassKg = 0;
      let heads = 0;
      let costR$ = 0;

      if (storeBatchItems.length > 0) {
        carcassKg = storeBatchItems.reduce((acc, it) => acc + (it.estimatedWeightKg || 0), 0);
        heads = storeBatchItems.reduce((acc, it) => acc + (it.pedido || 0), 0);
        costR$ = storeBatchItems.reduce((acc, it) => acc + (it.estimatedTotalR$ || 0), 0);
      } else {
        heads = row.pedidoFinal !== undefined && row.pedidoFinal > 0 ? row.pedidoFinal : (row.boi || 0);
        carcassKg = heads * yieldParams.carcassWeight;
        costR$ = carcassKg * yieldParams.costPerKg;
      }

      const liveKg = carcassYieldPct > 0 ? carcassKg / (carcassYieldPct / 100) : carcassKg / 0.54;
      const coolingKg = carcassKg * (coolingLossPct / 100);

      const storeWaste = wasteRecords.filter(w => w.storeId === row.storeId);
      let boneFatKg = carcassKg * 0.24;
      let wasteRevR$ = carcassKg * 0.175 * yieldParams.bonePriceKg + carcassKg * 0.065 * yieldParams.fatPriceKg;
      if (storeWaste.length > 0) {
        const realBF = storeWaste.reduce((acc, w) => acc + (w.boneWeightKg || 0) + (w.fatWeightKg || 0), 0);
        if (realBF > 0 && realBF <= carcassKg * 0.45) {
          boneFatKg = realBF;
          wasteRevR$ = storeWaste.reduce((acc, w) => acc + (w.boneRevenueR$ || 0) + (w.fatRevenueR$ || 0), 0);
        }
      }

      const debonedKg = Math.max(0, carcassKg - coolingKg - boneFatKg);
      const trimKg = debonedKg * (packagingTrimPct / 100);
      const packagedKg = Math.max(0, debonedKg - trimKg);
      const deboningLossKg = Math.max(0, carcassKg - packagedKg);

      const yieldOnLivePct = liveKg > 0 ? (packagedKg / liveKg) * 100 : 0;
      const yieldOnCarcassPct = carcassKg > 0 ? (packagedKg / carcassKg) * 100 : 0;
      const netCostPerPackagedKg = packagedKg > 0 ? Math.max(0, costR$ - wasteRevR$) / packagedKg : 0;

      return {
        storeId: row.storeId,
        storeName: store ? store.name : row.storeName,
        heads,
        liveKg,
        carcassKg,
        boneFatKg,
        coolingAndTrimKg: coolingKg + trimKg,
        deboningLossKg,
        packagedKg,
        yieldOnLivePct,
        yieldOnCarcassPct,
        netCostPerPackagedKg
      };
    });
  }, [rows, stores, batches, wasteRecords, selectedStoreId, yieldParams, carcassYieldPct, coolingLossPct, packagingTrimPct]);

  const activeStage = funnelModel.stages.find(s => s.id === activeStageId) || funnelModel.stages[4];

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Controles de Calibragem do Funil */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Funil de Conversão & Perda de Peso na Desossa (Peso Vivo → Carne Embalada)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rastreamento completo da redução de massa desde o animal vivo de entrada até o peso líquido final embalado para balcão · {periodLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetTechnicalDefaults}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer self-start xl:self-auto whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão Técnico</span>
          </button>
        </div>

        {/* Barra de Parâmetros Ajustáveis */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Rendimento Carcaça / Peso Vivo
              </span>
              <span className="font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
                {formatNumberBR(carcassYieldPct, 1)}%
              </span>
            </div>
            <input
              type="range"
              min={48}
              max={58}
              step={0.5}
              value={carcassYieldPct}
              onChange={(e) => setCarcassYieldPct(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>48% (Vaca/Magro)</span>
              <span>54% (Padrão)</span>
              <span>58% (Confinado)</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Desidratação em Câmara (Gancho)
              </span>
              <span className="font-mono tabular-nums font-bold text-sky-700 dark:text-sky-400">
                {formatNumberBR(coolingLossPct, 1)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.5}
              step={0.1}
              value={coolingLossPct}
              onChange={(e) => setCoolingLossPct(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>0,5%</span>
              <span>1,5% (Técnico)</span>
              <span>3,5%</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Refile & Exsudato na Embalagem
              </span>
              <span className="font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400">
                {formatNumberBR(packagingTrimPct, 1)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={6.0}
              step={0.5}
              value={packagingTrimPct}
              onChange={(e) => setPackagingTrimPct(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
              <span>0,5%</span>
              <span>2,5% (Padrão)</span>
              <span>6,0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs Comparativos Principais: Entrada (Vivo) vs Saída (Carne Embalada) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Peso Vivo de Entrada (100%)
            </span>
            <Beef className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatNumberBR(funnelModel.liveWeightKg, 0)} <span className="text-sm font-normal">kg</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {formatNumberBR(funnelModel.effectiveHeads, 0)} cab · Média {formatNumberBR(funnelModel.liveWeightKg / funnelModel.effectiveHeads, 1)} kg/boi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Peso Carcaça Entrada Desossa
            </span>
            <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
            {formatNumberBR(funnelModel.effectiveCarcassKg, 0)} <span className="text-sm font-normal">kg</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {formatNumberBR(carcassYieldPct, 1)}% do vivo · {formatCurrencyBRL(funnelModel.costPerKgCarcass)}/kg
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Perda Total (Abate + Desossa)
            </span>
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            -{formatNumberBR(funnelModel.totalWeightLostFromLiveKg, 0)} <span className="text-sm font-normal">kg</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            -{formatNumberBR(funnelModel.totalLossFromLivePct, 1)}% do vivo · -{formatNumberBR(funnelModel.deboningLossOnCarcassPct, 1)}% na desossa
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
              Carne Embalada Final
            </span>
            <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatNumberBR(funnelModel.finalPackagedKg, 0)} <span className="text-sm font-normal">kg</span>
          </div>
          <div className="mt-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono tabular-nums font-semibold">
            {formatNumberBR(funnelModel.finalYieldOnLivePct, 1)}% do vivo · {formatNumberBR(funnelModel.finalYieldOnCarcassPct, 1)}% da carcaça
          </div>
        </div>
      </div>

      {/* Área Principal: Funil Visual Proporcional (Esquerda) + Painel Analítico Comparativo (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Funil Visual Proporcional */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Funil Proporcional de Perda de Peso (Etapa a Etapa)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A largura de cada faixa representa a massa real retida em relação aos 100% do peso vivo. Clique em uma etapa para auditar.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {funnelModel.stages.length} Etapas
            </span>
          </div>

          <div className="py-5 space-y-2">
            {funnelModel.stages.map((stage, idx) => {
              const isSelected = stage.id === activeStageId;
              // Largura proporcional centrada (mínimo de 28% para manter legibilidade dos textos internos)
              const visualWidthPct = Math.max(28, Math.min(100, stage.pctOfLiveWeight));

              return (
                <React.Fragment key={stage.id}>
                  {/* Seta / Conector de Perda entre etapas */}
                  {idx > 0 && (
                    <div className="flex items-center justify-center py-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 text-[11px]">
                        <ArrowDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="font-semibold text-rose-800 dark:text-rose-300">
                          {stage.lossBeforeLabel}:
                        </span>
                        <span className="font-mono tabular-nums font-extrabold text-rose-700 dark:text-rose-400">
                          -{formatNumberBR(stage.lossBeforeKg, 0)} kg
                        </span>
                        <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400/90">
                          (-{formatNumberBR(stage.lossBeforePctOfLive, 1)}% do vivo)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Barra Trapezoidal / Funil Centralizado */}
                  <button
                    type="button"
                    onClick={() => setActiveStageId(stage.id)}
                    className="w-full flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <div
                      style={{ width: `${visualWidthPct}%` }}
                      className={`transition-all duration-200 rounded-xl px-4 py-3 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left ${stage.barColor} ${stage.barBorder} ${stage.textColor} ${
                        isSelected
                          ? 'ring-2 ring-amber-400 dark:ring-amber-400 shadow-md scale-[1.01]'
                          : 'opacity-95 group-hover:opacity-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold bg-black/20 px-1.5 py-0.5 rounded">
                            0{stage.stepNumber}
                          </span>
                          <span className="font-bold text-xs sm:text-sm truncate">
                            {stage.title}
                          </span>
                        </div>
                        <div className="text-[11px] opacity-85 truncate mt-0.5">
                          {stage.subtitle}
                        </div>
                      </div>

                      <div className="text-left sm:text-right font-mono tabular-nums shrink-0">
                        <div className="text-sm sm:text-base font-extrabold leading-tight">
                          {formatNumberBR(stage.weightKg, 0)} kg
                        </div>
                        <div className="text-[11px] opacity-90 font-semibold">
                          {formatNumberBR(stage.pctOfLiveWeight, 1)}% vivo · {formatNumberBR(stage.kgPerHead, 1)} kg/boi
                        </div>
                      </div>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Base de Graxaria: <strong>{funnelModel.hasRealWaste ? 'Registros reais do módulo Descarte' : 'Padrão técnico (17,5% osso + 6,5% sebo)'}</strong>
            </span>
            <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
              Crédito Graxaria Recuperado: +{formatCurrencyBRL(funnelModel.wasteRecoveredR$)}
            </span>
          </div>
        </div>

        {/* Painel Direito: Comparativo Direto Peso Vivo vs Carne Embalada + Detalhe da Etapa Selecionada */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Card 1: Comparativo Peso Vivo vs Carne Embalada */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Comparativo Direto: Entrada vs. Produto Embalado
              </h4>
              <span className="text-[11px] font-mono text-slate-500">Por Boi & Total</span>
            </div>

            {/* Barra Empilhada de Destino dos 100% do Peso Vivo */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">Destino de 100% do Peso Vivo</span>
                <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatNumberBR(funnelModel.finalYieldOnLivePct, 1)}% aproveitado em carne
                </span>
              </div>
              <div className="h-7 w-full rounded-lg overflow-hidden flex text-[10px] font-mono font-bold text-white border border-slate-200 dark:border-slate-700">
                <div
                  style={{ width: `${funnelModel.finalYieldOnLivePct}%` }}
                  className="bg-emerald-600 flex items-center justify-center px-1 truncate"
                  title={`Carne Embalada: ${formatNumberBR(funnelModel.finalYieldOnLivePct, 1)}%`}
                >
                  {formatNumberBR(funnelModel.finalYieldOnLivePct, 1)}% Embalada
                </div>
                <div
                  style={{
                    width: `${
                      funnelModel.liveWeightKg > 0
                        ? (funnelModel.totalBoneFatKg / funnelModel.liveWeightKg) * 100
                        : 13
                    }%`
                  }}
                  className="bg-amber-600 flex items-center justify-center px-1 truncate"
                  title={`Osso & Sebo: ${formatNumberBR((funnelModel.totalBoneFatKg / funnelModel.liveWeightKg) * 100, 1)}%`}
                >
                  Osso/Sebo
                </div>
                <div
                  style={{
                    width: `${
                      funnelModel.liveWeightKg > 0
                        ? ((funnelModel.coolingLossKg + funnelModel.packagingLossKg) / funnelModel.liveWeightKg) * 100
                        : 2
                    }%`
                  }}
                  className="bg-sky-600"
                  title={`Câmara + Refile: ${formatNumberBR(((funnelModel.coolingLossKg + funnelModel.packagingLossKg) / funnelModel.liveWeightKg) * 100, 1)}%`}
                />
                <div
                  className="bg-slate-600 flex-1 flex items-center justify-center px-1 truncate"
                  title={`Perda de Abate: ${formatNumberBR(100 - carcassYieldPct, 1)}%`}
                >
                  Abate ({formatNumberBR(100 - carcassYieldPct, 0)}%)
                </div>
              </div>
            </div>

            {/* Tabela Resumo Entrada vs Saída */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Peso Vivo Médio (Entrada)</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {formatNumberBR(funnelModel.liveWeightKg / funnelModel.effectiveHeads, 1)} kg/boi ({formatNumberBR(funnelModel.liveWeightKg, 0)} kg)
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Carcaça Média (Gancho)</span>
                <span className="font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400">
                  {formatNumberBR(funnelModel.effectiveCarcassKg / funnelModel.effectiveHeads, 1)} kg/boi ({formatNumberBR(funnelModel.effectiveCarcassKg, 0)} kg)
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Descarte Osso + Sebo</span>
                <span className="font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400">
                  -{formatNumberBR(funnelModel.totalBoneFatKg / funnelModel.effectiveHeads, 1)} kg/boi (-{formatNumberBR(funnelModel.totalBoneFatKg, 0)} kg)
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Quebra Câmara + Refile Embalagem</span>
                <span className="font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                  -{formatNumberBR((funnelModel.coolingLossKg + funnelModel.packagingLossKg) / funnelModel.effectiveHeads, 1)} kg/boi (-{formatNumberBR(funnelModel.coolingLossKg + funnelModel.packagingLossKg, 0)} kg)
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30 px-2 rounded-lg mt-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-300">Carne Embalada Final (Balcão)</span>
                <span className="font-mono tabular-nums font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatNumberBR(funnelModel.finalPackagedKg / funnelModel.effectiveHeads, 1)} kg/boi ({formatNumberBR(funnelModel.finalPackagedKg, 0)} kg)
                </span>
              </div>
            </div>

            {/* Evolução de Custo por KG por Conta da Perda de Peso */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center font-mono tabular-nums">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-sans text-[10px] text-slate-500 block">Custo / kg Vivo</span>
                <strong className="text-xs text-slate-800 dark:text-slate-200">
                  {formatCurrencyBRL(funnelModel.costPerKgLive)}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <span className="font-sans text-[10px] text-blue-700 dark:text-blue-300 block">Custo / kg Carcaça</span>
                <strong className="text-xs text-blue-800 dark:text-blue-200">
                  {formatCurrencyBRL(funnelModel.costPerKgCarcass)}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                <span className="font-sans text-[10px] text-emerald-700 dark:text-emerald-300 block">Custo / kg Embalado</span>
                <strong className="text-xs text-emerald-800 dark:text-emerald-200">
                  {formatCurrencyBRL(funnelModel.costPerKgPackagedNet)}
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: Auditoria da Etapa Selecionada + Composição Embalada */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex-1">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Etapa 0{activeStage.stepNumber}: {activeStage.title}
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-sans text-[10px] text-slate-500 block">Peso Retido</span>
                <strong className="text-sm text-slate-900 dark:text-white">
                  {formatNumberBR(activeStage.weightKg, 0)} kg
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-sans text-[10px] text-slate-500 block">% s/ Peso Vivo</span>
                <strong className="text-sm text-emerald-700 dark:text-emerald-400">
                  {formatNumberBR(activeStage.pctOfLiveWeight, 1)}%
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="font-sans text-[10px] text-slate-500 block">Quebra da Etapa</span>
                <strong className="text-sm text-rose-600 dark:text-rose-400">
                  -{formatNumberBR(activeStage.lossBeforeKg, 0)} kg
                </strong>
              </div>
            </div>

            {/* Composição da Carne Embalada Final por Família de Cortes */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Distribuição Estimada da Carne Embalada Final ({formatNumberBR(funnelModel.finalPackagedKg, 0)} kg)
              </span>
              {funnelModel.cutFamilies.map((fam) => (
                <div key={fam.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {fam.name} <span className="text-slate-400 font-normal">({fam.cuts})</span>
                    </span>
                    <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white shrink-0 ml-2">
                      {formatNumberBR(fam.kg, 0)} kg ({formatNumberBR(fam.shareOfPackagedPct, 1)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fam.color}`} style={{ width: `${fam.shareOfPackagedPct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Analítica por Filial: Peso Vivo vs Carcaça vs Perdas vs Carne Embalada */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Detalhamento do Funil de Desossa por Filial ({storeFunnelRows.length} {storeFunnelRows.length === 1 ? 'Loja' : 'Lojas'})
            </h4>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Comparativo completo da conversão Peso Vivo → Carcaça → Carne Embalada
          </span>
        </div>

        <div className="overflow-x-auto erp-scrollbar">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Filial</th>
                <th className="px-3 py-3 text-right">Cabeças</th>
                <th className="px-3 py-3 text-right">Peso Vivo Entrada</th>
                <th className="px-3 py-3 text-right">Carcaça c/ Osso</th>
                <th className="px-3 py-3 text-right">Osso + Sebo</th>
                <th className="px-3 py-3 text-right">Câmara + Refile</th>
                <th className="px-3 py-3 text-right bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                  Carne Embalada Final
                </th>
                <th className="px-3 py-3 text-right">Rend. s/ Vivo</th>
                <th className="px-3 py-3 text-right">Rend. s/ Carcaça</th>
                <th className="px-4 py-3 text-right">Custo /kg Embalado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono tabular-nums">
              {storeFunnelRows.map((row) => (
                <tr key={row.storeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {row.storeName}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">
                    {formatNumberBR(row.heads, 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-800 dark:text-slate-200 font-semibold">
                    {formatNumberBR(row.liveKg, 0)} kg
                  </td>
                  <td className="px-3 py-2.5 text-right text-blue-700 dark:text-blue-400">
                    {formatNumberBR(row.carcassKg, 0)} kg
                  </td>
                  <td className="px-3 py-2.5 text-right text-amber-700 dark:text-amber-400">
                    -{formatNumberBR(row.boneFatKg, 0)} kg
                  </td>
                  <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400">
                    -{formatNumberBR(row.coolingAndTrimKg, 0)} kg
                  </td>
                  <td className="px-3 py-2.5 text-right font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                    {formatNumberBR(row.packagedKg, 0)} kg
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    {formatNumberBR(row.yieldOnLivePct, 1)}%
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">
                    {formatNumberBR(row.yieldOnCarcassPct, 1)}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrencyBRL(row.netCostPerPackagedKg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
