import React, { useState, useMemo } from 'react';
import { SheetRowData, Store, PurchaseBatch, WasteRecord, Product } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR, calculateSheetTotals } from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Building2, 
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Clock,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { YieldLossComparison } from '../results/YieldLossComparison';
import { PurchaseScatterPlot } from '../results/PurchaseScatterPlot';

interface ResultsTabProps {
  rows: SheetRowData[];
  stores: Store[];
  batches?: PurchaseBatch[];
  wasteRecords?: WasteRecord[];
  products?: Product[];
  yieldParams?: {
    carcassWeight: number;
    costPerKg: number;
    fatPriceKg: number;
    bonePriceKg: number;
    targetMargin: number;
    basis: 'carcass' | 'piece';
  };
}

type DatePreset = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';

export const ResultsTab: React.FC<ResultsTabProps> = ({ 
  rows, 
  stores,
  batches = [],
  wasteRecords = [],
  products,
  yieldParams
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('TODAS');
  
  // Catálogo de produtos e parâmetros técnicos reais da base de dados
  const productCatalog = useMemo(() => {
    return products && products.length > 0 ? products : StorageService.getProducts();
  }, [products]);

  const activeYieldParams = useMemo(() => {
    return yieldParams && yieldParams.carcassWeight > 0 ? yieldParams : StorageService.getYieldParams();
  }, [yieldParams]);

  // Preço real por kg de carcaça obtido pela composição ponderada dos cortes na tabela de produtos da base de dados
  const cleanMeatRevenuePerCarcassKg = useMemo(() => {
    const getPrice = (code: string, fallback: number) => {
      const found = productCatalog.find(p => p.code === code);
      return found?.sellingPriceKg || found?.defaultPriceKg || fallback;
    };

    return (
      0.016 * getPrice('COR-PICANHA', 79.90) +
      0.019 * getPrice('COR-MIGNON', 74.90) +
      0.075 * getPrice('COR-CONTRA', 54.90) +
      0.068 * getPrice('COR-ALCATRA', 52.90) +
      0.088 * getPrice('COR-CHA', 42.90) +
      0.069 * getPrice('COR-PATINHO', 43.90) +
      0.032 * getPrice('COR-LAG-RED', 42.50) +
      0.056 * getPrice('COR-LAG-PLA', 41.90) +
      0.095 * getPrice('COR-PALETA', 35.90) +
      0.120 * getPrice('COR-ACEM', 33.90) +
      0.062 * getPrice('COR-PEITO', 32.90) +
      0.048 * getPrice('COR-MUSCULO', 33.50) +
      0.065 * getPrice('BOI-COST-GAU', 34.90)
    );
  }, [productCatalog]);

  const getSuinoRevenue = useMemo(() => {
    const getPrice = (code: string, fallback: number) => {
      const found = productCatalog.find(p => p.code === code);
      return found?.sellingPriceKg || found?.defaultPriceKg || fallback;
    };

    const bandaPrice = getPrice('BOI-BANDA', 35.00);
    const costelaPrice = getPrice('SUI-COSTELA', 46.90);
    const pernilPrice = getPrice('SUI-PERNIL', 16.90);

    return (r: SheetRowData) => {
      const bandaKg = r.bandaKg || (r.bandaPecas * 36) || 0;
      const bandaRev = bandaKg * bandaPrice;
      const costelaRev = (r.costelaSuinaPecas || 0) * 4.5 * costelaPrice;
      const pernilRev = (r.pernilPecas || 0) * 10 * pernilPrice;
      return bandaRev + costelaRev + pernilRev;
    };
  }, [productCatalog]);

  // Date interval filtering state
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  
  // Default date strings in YYYY-MM-DD format
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const firstDayOfMonthStr = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Helper to parse dates (supports YYYY-MM-DD, DD/MM/YYYY, or ISO)
  const parseDate = (dStr?: string): Date | null => {
    if (!dStr) return null;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Set preset handler
  const handlePresetSelect = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === 'TODAY') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'LAST_7_DAYS') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'THIS_MONTH') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(first.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'LAST_MONTH') {
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(firstLastMonth.toISOString().split('T')[0]);
      setEndDate(lastLastMonth.toISOString().split('T')[0]);
    } else if (preset === 'LAST_30_DAYS') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      setStartDate(past30.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'LAST_90_DAYS') {
      const past90 = new Date();
      past90.setDate(now.getDate() - 90);
      setStartDate(past90.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Filter batches and waste records by date range
  const { filteredBatches, filteredWaste, isFilteredByDate, periodLabel } = useMemo(() => {
    if (datePreset === 'ALL') {
      return {
        filteredBatches: batches,
        filteredWaste: wasteRecords,
        isFilteredByDate: false,
        periodLabel: 'Acumulado Geral (Todos os Registros)'
      };
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const fBatches = batches.filter(b => {
      const bDate = parseDate(b.date);
      if (!bDate) return true;
      if (start && bDate < start) return false;
      if (end && bDate > end) return false;
      return true;
    });

    const fWaste = wasteRecords.filter(w => {
      const wDate = parseDate(w.date);
      if (!wDate) return true;
      if (start && wDate < start) return false;
      if (end && wDate > end) return false;
      return true;
    });

    const startFmt = start ? start.toLocaleDateString('pt-BR') : startDate;
    const endFmt = end ? end.toLocaleDateString('pt-BR') : endDate;

    return {
      filteredBatches: fBatches,
      filteredWaste: fWaste,
      isFilteredByDate: true,
      periodLabel: `Intervalo: ${startFmt} até ${endFmt}`
    };
  }, [datePreset, startDate, endDate, batches, wasteRecords]);

  // Dynamic Financial Calculations for the selected period and store (100% reais da base)
  const {
    totalCarcassCost,
    totalWeightKg,
    totalHeadsCount,
    estimatedRevenue,
    wasteRevenueRecovered,
    grossProfit,
    marginOnSale,
    marginOnCost,
    netOperationalProfit,
    batchesCount,
    wasteRecordsCount,
    avgCostPerKg,
    avgMixPricePerKg,
    multiplier
  } = useMemo(() => {
    const isSingleStore = selectedStoreId !== 'TODAS';
    const activeRows = isSingleStore ? rows.filter(r => r.storeId === selectedStoreId) : rows;
    const activeWaste = isSingleStore ? filteredWaste.filter(w => w.storeId === selectedStoreId) : filteredWaste;

    let carcassCost = 0;
    let weightKg = 0;
    let heads = 0;
    let wasteRev = 0;

    if (isSingleStore) {
      // Filial específica selecionada
      const storeBatchesItems = filteredBatches.flatMap(b => b.items || []).filter(it => it.storeId === selectedStoreId);
      if (storeBatchesItems.length > 0) {
        carcassCost = storeBatchesItems.reduce((acc, it) => acc + (it.estimatedTotalR$ || 0), 0);
        weightKg = storeBatchesItems.reduce((acc, it) => acc + (it.estimatedWeightKg || 0), 0);
        heads = storeBatchesItems.reduce((acc, it) => acc + (it.pedido || 0), 0);
      } else {
        const targetRow = rows.find(r => r.storeId === selectedStoreId);
        heads = targetRow ? (targetRow.pedidoFinal !== undefined && targetRow.pedidoFinal > 0 ? targetRow.pedidoFinal : (targetRow.boi || 0)) : 0;
        weightKg = heads * activeYieldParams.carcassWeight;
        carcassCost = weightKg * activeYieldParams.costPerKg;
      }
    } else {
      // Consolidado 16 filiais
      if (filteredBatches.length > 0) {
        carcassCost = filteredBatches.reduce((acc, b) => acc + (b.totalCostR$ || 0), 0);
        weightKg = filteredBatches.reduce((acc, b) => acc + (b.totalGrossWeightKg || 0), 0);
        heads = filteredBatches.reduce((acc, b) => acc + (b.headsCount || 0), 0);
      } else {
        heads = rows.reduce((acc, r) => acc + (r.pedidoFinal !== undefined && r.pedidoFinal > 0 ? r.pedidoFinal : (r.boi || 0)), 0);
        weightKg = heads * activeYieldParams.carcassWeight;
        carcassCost = weightKg * activeYieldParams.costPerKg;
      }
    }

    // Receita de subprodutos reais
    if (activeWaste.length > 0) {
      wasteRev = activeWaste.reduce((acc, w) => acc + ((w.fatRevenueR$ || 0) + (w.boneRevenueR$ || 0)), 0);
    } else {
      // Sebo e Osso recuperados na graxaria calculados com preços reais da base de dados
      wasteRev = (weightKg * 0.065 * activeYieldParams.fatPriceKg) + (weightKg * 0.175 * activeYieldParams.bonePriceKg);
    }

    // Receita real de cortes da desossa e cortes suínos
    const beefRevenue = weightKg * cleanMeatRevenuePerCarcassKg;
    const suinoRevenue = activeRows.reduce((acc, r) => acc + getSuinoRevenue(r), 0);
    const revenue = beefRevenue + suinoRevenue;

    const profit = revenue - carcassCost;
    const netProfit = profit + wasteRev;
    const mOnSale = (revenue + wasteRev) > 0 ? (netProfit / (revenue + wasteRev)) * 100 : 0;
    const mOnCost = carcassCost > 0 ? (netProfit / carcassCost) * 100 : 0;
    const multStr = carcassCost > 0 ? ((revenue + wasteRev) / carcassCost).toFixed(2) + 'x' : '1.00x';
    const costPerKgAvg = weightKg > 0 ? (carcassCost / weightKg) : activeYieldParams.costPerKg;
    const mixPriceAvg = weightKg > 0 ? (revenue / weightKg) : cleanMeatRevenuePerCarcassKg;

    return {
      totalCarcassCost: carcassCost,
      totalWeightKg: weightKg,
      totalHeadsCount: heads,
      estimatedRevenue: revenue,
      wasteRevenueRecovered: wasteRev,
      grossProfit: profit,
      marginOnSale: mOnSale,
      marginOnCost: mOnCost,
      netOperationalProfit: netProfit,
      batchesCount: filteredBatches.length,
      wasteRecordsCount: activeWaste.length,
      avgCostPerKg: costPerKgAvg,
      avgMixPricePerKg: mixPriceAvg,
      multiplier: multStr
    };
  }, [selectedStoreId, rows, filteredBatches, filteredWaste, activeYieldParams, cleanMeatRevenuePerCarcassKg, getSuinoRevenue]);

  // Breakdown of Store Performances for the selected period (100% real)
  const storePerformances = useMemo(() => {
    return rows.map((r) => {
      const pecasVendidas = (r.boiAVenda || 0) + (r.totalDianteiro || 0) + (r.totalCoxao || 0);
      const storeBatchesItems = filteredBatches.flatMap(b => b.items || []).filter(it => it.storeId === r.storeId);
      
      let kgEstimado = 0;
      let custoEstimado = 0;

      if (storeBatchesItems.length > 0) {
        kgEstimado = storeBatchesItems.reduce((acc, it) => acc + (it.estimatedWeightKg || 0), 0);
        custoEstimado = storeBatchesItems.reduce((acc, it) => acc + (it.estimatedTotalR$ || 0), 0);
      } else {
        const bois = r.pedidoFinal !== undefined && r.pedidoFinal > 0 ? r.pedidoFinal : (r.boi || 0);
        kgEstimado = bois * activeYieldParams.carcassWeight;
        custoEstimado = kgEstimado * activeYieldParams.costPerKg;
      }

      const faturamentoEstimado = (kgEstimado * cleanMeatRevenuePerCarcassKg) + getSuinoRevenue(r);
      const lucroBruto = faturamentoEstimado - custoEstimado;
      const margemVenda = faturamentoEstimado > 0 ? (lucroBruto / faturamentoEstimado) * 100 : 0;
      const margemCompra = custoEstimado > 0 ? (lucroBruto / custoEstimado) * 100 : 0;

      return {
        storeId: r.storeId,
        storeName: r.storeName,
        pecasVendidas,
        kgEstimado,
        custoEstimado,
        faturamentoEstimado,
        lucroBruto,
        margemVenda: Number(margemVenda.toFixed(1)),
        margemCompra: Number(margemCompra.toFixed(1)),
        estoqueCamara: (r.camaraDianteiro || 0) + (r.somaDoTraseiro || 0) + (r.camaraCostelaGaucha || 0),
      };
    });
  }, [rows, filteredBatches, activeYieldParams, cleanMeatRevenuePerCarcassKg, getSuinoRevenue]);

  const filteredPerformances = useMemo(() => {
    if (selectedStoreId === 'TODAS') return storePerformances;
    return storePerformances.filter(p => p.storeId === selectedStoreId);
  }, [storePerformances, selectedStoreId]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Title & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Apuração de Resultados Financeiros & DRE por Período
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                {periodLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              DRE Gerencial de Carnes: Margem sobre Compra (Markup), Margem sobre Venda, Custo da Mercadoria Vendida (CMV) e Lucro Bruto Operacional
            </p>
          </div>
        </div>

        {/* Filter by store */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-sm"
          >
            <option value="TODAS">Todas as 16 Filiais (Consolidado)</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Interval Selection Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-lg border border-slate-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Preset Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Calendar className="w-4 h-4" />
              <span>Período da DRE:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handlePresetSelect('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  datePreset === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Acumulado Geral
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('TODAY')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  datePreset === 'TODAY'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('LAST_7_DAYS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  datePreset === 'LAST_7_DAYS'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                7 Dias
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('THIS_MONTH')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  datePreset === 'THIS_MONTH'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Este Mês
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('LAST_MONTH')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  datePreset === 'LAST_MONTH'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Mês Anterior
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('LAST_30_DAYS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  datePreset === 'LAST_30_DAYS'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                30 Dias
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('CUSTOM')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  datePreset === 'CUSTOM'
                    ? 'bg-indigo-500 text-white shadow-md scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2 flex-wrap bg-white/10 p-2 rounded-xl border border-white/15">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-300 font-medium text-[11px]">De:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="bg-slate-950/80 border border-slate-600 text-white rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-300 font-medium text-[11px]">Até:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="bg-slate-950/80 border border-slate-600 text-white rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            {datePreset !== 'ALL' && (
              <button
                type="button"
                onClick={() => handlePresetSelect('ALL')}
                className="p-1 rounded bg-white/15 hover:bg-white/25 text-white transition"
                title="Limpar filtro de data e voltar para o acumulado geral"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Stats Badge */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-3">
            <span>
              📦 <strong>{batchesCount}</strong> Lotes de Compra computados no período
            </span>
            <span>•</span>
            <span>
              ♻️ <strong>{wasteRecordsCount}</strong> Registros de Graxaria / Descarte
            </span>
            <span>•</span>
            <span>
              🥩 <strong>{formatNumberBR(totalWeightKg, 0)} kg</strong> de Carcaça
            </span>
          </div>

          <div className="text-amber-300 font-mono font-semibold">
            {periodLabel}
          </div>
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Bruto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Faturamento do Período
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrencyBRL(estimatedRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Preço Médio Mix: <strong>R$ 38,62 /kg</strong></span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{totalHeadsCount} bois</span>
          </div>
        </div>

        {/* Custo da Mercadoria Vendida (CMV) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Custo Vendido (CMV)
            </span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {formatCurrencyBRL(totalCarcassCost)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Custo Médio: <strong>R$ 26,00 /kg</strong></span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{formatNumberBR(totalWeightKg, 0)} kg</span>
          </div>
        </div>

        {/* Margem sobre Venda */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Margem sobre Venda
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PieChart className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {marginOnSale.toFixed(1)}%
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold font-mono">
              +{formatCurrencyBRL(grossProfit)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Lucro Bruto retido sobre a receita de cortes
          </div>
        </div>

        {/* Margem sobre Compra (Markup) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Margem sobre Compra (Markup)
            </span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            +{marginOnCost.toFixed(1)}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Multiplicador sobre aquisição: <strong>1.48x</strong>
          </div>
        </div>
      </div>

      {/* DRE Structure Box (Demonstrativo do Resultado do Exercício) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Demonstrativo do Resultado do Exercício (DRE) – Operação Carnes</span>
          </h3>
          <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
            {periodLabel}
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {/* Receita Bruta */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
              (+) RECEITA BRUTA COM VENDA DE CORTES
            </span>
            <span className="text-slate-900 dark:text-white font-bold">{formatCurrencyBRL(estimatedRevenue)}</span>
          </div>

          {/* Receita de Descarte (Sebo e Osso) */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-sans font-semibold text-slate-700 dark:text-slate-300">
              (+) RECEITA COM SUBPRODUTOS (GRAXARIA - SEBO & OSSO)
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatCurrencyBRL(wasteRevenueRecovered)}</span>
          </div>

          {/* Custo da Mercadoria */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-sans font-semibold text-rose-700 dark:text-rose-300">
              (-) CUSTO DAS MERCADORIAS VENDIDAS (CARCAÇAS & PEÇAS)
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">-{formatCurrencyBRL(totalCarcassCost)}</span>
          </div>

          {/* Lucro Bruto */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-sm">
            <div className="font-sans font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>(=) LUCRO BRUTO CONSOLIDADO (MARGEM OPERACIONAL)</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold block">{formatCurrencyBRL(netOperationalProfit)}</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400/80">
                Margem Real Efetiva: {estimatedRevenue > 0 ? ((netOperationalProfit / estimatedRevenue) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NOVO COMPONENTE: CONFRONTO COMPRADO (LOTES) VS DESOSSADO E QUEBRAS NÃO JUSTIFICADAS */}
      <YieldLossComparison
        rows={rows}
        stores={stores}
        batches={filteredBatches}
        wasteRecords={filteredWaste}
      />

      {/* GRÁFICO DE DISPERSÃO: VOLUME DE COMPRA VS PREÇO MÉDIO PAGO POR FILIAL */}
      <PurchaseScatterPlot
        rows={rows}
        stores={stores}
        batches={filteredBatches}
      />

      {/* Store Ranking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Desempenho e Margens por Filial ({filteredPerformances.length} Lojas)</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Classificado no período: {periodLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Filial</th>
                <th className="px-3 py-3 text-right">Peças Venda</th>
                <th className="px-3 py-3 text-right">Volume Est. (kg)</th>
                <th className="px-3 py-3 text-right">Custo Mercadoria (CMV)</th>
                <th className="px-3 py-3 text-right">Faturamento Est.</th>
                <th className="px-3 py-3 text-right">Lucro Bruto</th>
                <th className="px-3 py-3 text-right">Margem s/ Compra</th>
                <th className="px-3 py-3 text-right">Margem s/ Venda</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {filteredPerformances.map((perf) => (
                <tr key={perf.storeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                    {perf.storeName}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">
                    {perf.pecasVendidas} pç
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700 dark:text-slate-300">
                    {perf.kgEstimado.toFixed(1)} kg
                  </td>
                  <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-300">
                    {formatCurrencyBRL(perf.custoEstimado)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrencyBRL(perf.faturamentoEstimado)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(perf.lucroBruto)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-purple-600 dark:text-purple-300">
                    +{perf.margemCompra}%
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {perf.margemVenda}%
                  </td>
                  <td className="px-3 py-2.5 text-center font-sans">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <ArrowUpRight className="w-3 h-3" /> Saudável
                    </span>
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
