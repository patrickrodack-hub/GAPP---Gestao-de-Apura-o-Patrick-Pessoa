import React, { useState, useMemo } from 'react';
import { SheetRowData, Store, PurchaseBatch } from '../../types/erp';
import { calculateSheetTotals, formatCurrencyBRL } from '../../services/calculationService';
import { NavigationTab } from '../Navigation';
import { DashboardTab } from '../tabs/DashboardTab';
import {
  Beef,
  Store as StoreIcon,
  TrendingUp,
  Layers,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Printer,
  FileSpreadsheet,
  ShoppingCart,
  Boxes,
  Scissors,
  Calculator,
  BarChart3,
  LayoutGrid,
  CheckCircle2
} from 'lucide-react';
import { DeboningYieldKpiPanel } from '../dashboard/DeboningYieldKpiPanel';

interface GappNewDashboardViewProps {
  rows: SheetRowData[];
  stores: Store[];
  batches: PurchaseBatch[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickCalc: () => void;
  onOpenPurchaseOrder: () => void;
  onPrint: () => void;
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const GappNewDashboardView: React.FC<GappNewDashboardViewProps> = ({
  rows,
  stores,
  batches,
  onNavigate,
  onOpenQuickCalc,
  onOpenPurchaseOrder,
  onPrint
}) => {
  const [viewMode, setViewMode] = useState<'executive' | 'charts'>(() => {
    try {
      const saved = localStorage.getItem('gapp_new_dashboard_view_mode');
      return saved === 'charts' ? 'charts' : 'executive';
    } catch {
      return 'executive';
    }
  });

  const handleChangeViewMode = (mode: 'executive' | 'charts') => {
    setViewMode(mode);
    try {
      localStorage.setItem('gapp_new_dashboard_view_mode', mode);
    } catch {}
  };

  const [analyticFilter, setAnalyticFilter] = useState<'all' | 'bovino' | 'suino'>('all');
  const [storeFilter, setStoreFilter] = useState<'all' | 'withOrder' | 'suino'>('all');

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const totals = useMemo(() => calculateSheetTotals(rows), [rows]);

  // Derived real metrics from the 16 stores
  const metrics = useMemo(() => {
    const totalBoiCalc = Math.round(totals.boi || 0);
    const totalVendaBoi = Math.round(totals.venda || totals.boiAVenda || 0);
    const totalSugestao = Math.round(totals.sugestaoPedido || 0);
    const totalPedidoBoi = Math.round(
      rows.reduce((acc, r) => acc + (r.pedidoFinal !== undefined ? r.pedidoFinal : 0), 0)
    );

    const totalPedAlcatrao = rows.reduce((acc, r) => acc + (r.pedidoAlcatraoReal || 0), 0);
    const totalPedCostelaG = rows.reduce((acc, r) => acc + (r.pedidoCostelaReal || 0), 0);

    const totalSuinoCamara = rows.reduce((acc, r) => acc + (r.bandaPecas || 0), 0);
    const totalPernil = rows.reduce((acc, r) => acc + (r.pernilPecas || 0), 0);
    const totalCostelaSuina = rows.reduce((acc, r) => acc + (r.costelaSuinaPecas || 0), 0);
    const totalVendaSuino = rows.reduce(
      (acc, r) => acc + (r.bandaVenda || r.vendaSuino || 0),
      0
    );
    const totalPedidoSuino = rows.reduce(
      (acc, r) => acc + (r.bandaPedido || r.pedidoSuino || 0),
      0
    );

    // Group 1: Cortes Base de Cálculo (Dianteiro + Traseiro + Coxão + Alcatrão base)
    const groupBovinoBase =
      totals.pedidoDianteiro +
      totals.pedidoTraseiro +
      totals.pedidoCoxao +
      totals.pedidoAlcatrao;

    // Group 2: Pedidos Especiais de Cortes (Pedido de Alcatrão + Costela G + Pedido de Costela G)
    const groupCortesEspeciais =
      totalPedAlcatrao + totals.pedidoCostelaGaucha + totalPedCostelaG;

    // Group 3: Linha Suína Completa (Suíno + Pernil + Costela Suína + Pedido de Suíno)
    const groupSuinoTotal =
      totalSuinoCamara + totalPernil + totalCostelaSuina + totalPedidoSuino;

    const grandVolume = Math.max(
      1,
      groupBovinoBase + groupCortesEspeciais + groupSuinoTotal
    );

    const pctBovinoBase = Math.max(15, Math.round((groupBovinoBase / grandVolume) * 100));
    const pctCortesEspeciais = Math.max(
      15,
      Math.round((groupCortesEspeciais / grandVolume) * 100)
    );
    const pctSuino = Math.max(10, 100 - pctBovinoBase - pctCortesEspeciais);

    // Chamber stock vs Order need ratio (100% card)
    const totalCamaraPecas =
      totals.camaraDianteiro +
      totals.somaDoTraseiro +
      totals.camaraCostelaGaucha +
      totalSuinoCamara;
    const totalPedidoPecas =
      groupBovinoBase + totalPedAlcatrao + totalPedCostelaG + totalPedidoSuino;
    const combinedStockOrder = Math.max(1, totalCamaraPecas + totalPedidoPecas);
    const stockRatioPct = Math.min(
      85,
      Math.max(20, Math.round((totalCamaraPecas / combinedStockOrder) * 100))
    );
    const orderRatioPct = 100 - stockRatioPct;

    // Top store by sales / order volume
    const sortedByVolume = [...rows].sort((a, b) => {
      const volA = (a.pedidoFinal || 0) + (a.venda || a.boiAVenda || 0);
      const volB = (b.pedidoFinal || 0) + (b.venda || b.boiAVenda || 0);
      return volB - volA;
    });
    const topRow = sortedByVolume[0] || rows[0];
    const topStore = stores.find(s => s.id === topRow?.storeId) || stores[0];

    // Estimated financial total
    const estimatedPurchaseBRL =
      totalPedidoBoi * 240 * 26.0 +
      (totalPedAlcatrao + totalPedCostelaG) * 28 * 32.0 +
      totalPedidoSuino * 45 * 14.5;

    return {
      totalBoiCalc,
      totalVendaBoi,
      totalSugestao,
      totalPedidoBoi,
      totalPedAlcatrao,
      totalPedCostelaG,
      totalSuinoCamara,
      totalPernil,
      totalCostelaSuina,
      totalVendaSuino,
      totalPedidoSuino,
      groupBovinoBase,
      groupCortesEspeciais,
      groupSuinoTotal,
      pctBovinoBase,
      pctCortesEspeciais,
      pctSuino,
      totalCamaraPecas,
      totalPedidoPecas,
      stockRatioPct,
      orderRatioPct,
      topRow,
      topStore,
      estimatedPurchaseBRL
    };
  }, [rows, stores, totals]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

    const cells: {
      day: number;
      isCurrentMonth: boolean;
      hasActivity: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      cells.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        hasActivity: false,
        isToday: false
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        d === today.getDate() &&
        calMonth === today.getMonth() &&
        calYear === today.getFullYear();
      // Highlight operational days (e.g., Mondays, Wednesdays, Fridays or batch dates)
      const hasActivity = d % 3 === 1 || d === today.getDate();
      cells.push({
        day: d,
        isCurrentMonth: true,
        hasActivity,
        isToday
      });
    }

    // Next month leading days to complete 35 or 42 cells
    const totalCells = cells.length <= 35 ? 35 : 42;
    let nextDay = 1;
    while (cells.length < totalCells) {
      cells.push({
        day: nextDay++,
        isCurrentMonth: false,
        hasActivity: false,
        isToday: false
      });
    }

    return cells;
  }, [calMonth, calYear, today]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  // Filtered stores for right-column feed
  const filteredStoreRows = useMemo(() => {
    if (storeFilter === 'withOrder') {
      return rows.filter(
        r =>
          (r.pedidoFinal || 0) > 0 ||
          (r.pedidoAlcatraoReal || 0) > 0 ||
          (r.pedidoCostelaReal || 0) > 0
      );
    }
    if (storeFilter === 'suino') {
      return rows.filter(
        r => (r.bandaPedido || r.pedidoSuino || 0) > 0 || (r.bandaPecas || 0) > 0
      );
    }
    return rows;
  }, [rows, storeFilter]);

  if (viewMode === 'charts') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e4e9e5]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#113829]" />
            <span className="text-xs font-extrabold text-[#113829]">
              Modo Gráficos & Tendências D3 (16 Filiais)
            </span>
          </div>
          <div className="flex items-center gap-1 p-1 bg-[#f4f6f4] rounded-full">
            <button
              type="button"
              onClick={() => handleChangeViewMode('executive')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-[#113829] flex items-center gap-1.5 transition cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Painel GAPP-NEW</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeViewMode('charts')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#113829] text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#b5e550]" />
              <span>Gráficos & Evolução</span>
            </button>
          </div>
        </div>

        <DashboardTab
          rows={rows}
          stores={stores}
          batches={batches}
          onNavigate={onNavigate}
          onOpenQuickCalc={onOpenQuickCalc}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Subtle Top Action Bar for Quick Switching between GAPP-NEW Bento Grid & Detailed Charts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-extrabold text-[#113829]">Visão Consolidada 16 Filiais</span>
          <span aria-hidden="true">·</span>
          <span>Boi Calc e Sugestão arredondados</span>
          <span aria-hidden="true">·</span>
          <span>17 Colunas Oficiais Integradas</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#e4e9e5] rounded-full shadow-2xs">
            <button
              type="button"
              onClick={() => handleChangeViewMode('executive')}
              className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#113829] text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <LayoutGrid className="w-3 h-3 text-[#b5e550]" />
              <span>Visão GAPP-NEW</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeViewMode('charts')}
              className="px-3 py-1 rounded-full text-[11px] font-bold text-slate-600 hover:text-[#113829] flex items-center gap-1.5 transition cursor-pointer"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Gráficos D3</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ROW 1: 4 EXECUTIVE KPI CARDS (EXACTLY MATCHING IMAGE TOP ROW)         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI CARD 1: Deep Forest Green (#113829) with Lime Area Sparkline */}
        <div
          onClick={() => onNavigate('sheet')}
          className="bg-[#113829] text-white rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden min-h-[168px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#b5e550]">
                <Beef className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-50/90">Pedido do Boi & Calc</span>
            </div>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onOpenPurchaseOrder();
              }}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-200/70 cursor-pointer"
              title="Abrir Pedido de Compra"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold tracking-tight font-mono tabular-nums">
                {metrics.totalPedidoBoi} cab.
              </span>
              <span className="text-[11px] text-[#b5e550] font-semibold font-mono">
                Boi Calc: {metrics.totalBoiCalc}
              </span>
            </div>
          </div>

          {/* Smooth Lime Area Sparkline + Right Percentage */}
          <div className="flex items-end justify-between gap-3 pt-1">
            <div className="flex-1 h-11">
              <svg viewBox="0 0 180 44" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gappLimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b5e550" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#b5e550" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,35 C25,32 40,16 65,22 C90,28 110,8 135,14 C155,18 168,6 180,10 L180,44 L0,44 Z"
                  fill="url(#gappLimeGrad)"
                />
                <path
                  d="M0,35 C25,32 40,16 65,22 C90,28 110,8 135,14 C155,18 168,6 180,10"
                  fill="none"
                  stroke="#b5e550"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="135" cy="14" r="3.5" fill="#113829" stroke="#b5e550" strokeWidth="2" />
              </svg>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold text-[#b5e550] font-mono">
                +{stores.length} Lojas
              </span>
            </div>
          </div>
        </div>

        {/* KPI CARD 2: White Card with Vertical Dashed Bars (Giro de Venda & Filiais) */}
        <div
          onClick={() => onNavigate('sheet')}
          className="bg-white border border-[#e4e9e5] rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition cursor-pointer min-h-[168px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f4f6f4] flex items-center justify-center text-[#113829]">
                <StoreIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Giro de Venda (Boi)</span>
            </div>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onPrint();
              }}
              className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              title="Ver Relatório"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              {metrics.totalVendaBoi} Bois
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              em {stores.length} filiais
            </span>
          </div>

          {/* Dashed vertical bars + percentage */}
          <div className="flex items-end justify-between gap-3 pt-1">
            <div className="flex items-end gap-2 h-10 flex-1">
              {rows.slice(0, 10).map((r, idx) => {
                const v = Math.round(r.venda || r.boiAVenda || 0);
                const hPct = Math.min(100, Math.max(30, v * 12));
                const isHighlight = idx === 3 || idx === 7;
                return (
                  <div
                    key={r.storeId}
                    className="flex-1 h-full flex items-end justify-center"
                    title={`${r.storeName}: Venda ${v} bois`}
                  >
                    <div
                      style={{ height: `${hPct}%` }}
                      className={`w-1.5 rounded-full border-r-2 border-dashed ${
                        isHighlight ? 'border-[#113829]' : 'border-slate-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-extrabold text-[#113829] font-mono shrink-0">
              100% Ativo
            </span>
          </div>
        </div>

        {/* KPI CARD 3: White Card with Vertical Column Bars & Floating Dark Pill (Sugestão Arredondada) */}
        <div
          onClick={() => onNavigate('sheet')}
          className="bg-white border border-[#e4e9e5] rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition cursor-pointer min-h-[168px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f4f6f4] flex items-center justify-center text-[#113829]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Sujestão & Cortes</span>
            </div>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onPrint();
              }}
              className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              {metrics.totalSugestao} Cab.
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Alcatrão: {metrics.totalPedAlcatrao} · Cost.G: {metrics.totalPedCostelaG}
            </span>
          </div>

          {/* Vertical Column Bars with Dark Tooltip Badge */}
          <div className="flex items-end justify-between gap-2 pt-1 relative">
            <div className="flex items-end gap-1.5 h-10 flex-1">
              {[45, 68, 52, 95, 64, 78, 58, 84].map((val, i) => (
                <div key={i} className="flex-1 h-full flex items-end relative">
                  {i === 3 && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#113829] text-white font-mono font-bold text-[9px] whitespace-nowrap shadow-xs z-10">
                      {metrics.groupBovinoBase} pçs
                    </span>
                  )}
                  <div
                    style={{ height: `${val}%` }}
                    className={`w-full rounded-t-md ${
                      i === 3
                        ? 'bg-[#113829]'
                        : i === 5
                        ? 'bg-[#b5e550]'
                        : 'bg-[#e9edea]'
                    }`}
                  />
                </div>
              ))}
            </div>
            <span className="text-xs font-extrabold text-emerald-700 font-mono shrink-0">
              Arred.
            </span>
          </div>
        </div>

        {/* KPI CARD 4: White Card with Store Badges & Vertical Mini Bars (Linha Suína Completa) */}
        <div
          onClick={() => onNavigate('sheet')}
          className="bg-white border border-[#e4e9e5] rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition cursor-pointer min-h-[168px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#f4f6f4] flex items-center justify-center text-[#113829]">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Pedido & Venda Suíno</span>
            </div>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onPrint();
              }}
              className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
              {metrics.totalPedidoSuino} Bandas
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Venda: {metrics.totalVendaSuino}
            </span>
          </div>

          {/* Left overlapping avatars + Right mini bars */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center -space-x-2">
              <span
                className="w-7 h-7 rounded-full bg-[#113829] text-[#b5e550] border-2 border-white text-[9px] font-black flex items-center justify-center"
                title={`Suíno Câmara: ${metrics.totalSuinoCamara}`}
              >
                S:{metrics.totalSuinoCamara}
              </span>
              <span
                className="w-7 h-7 rounded-full bg-teal-700 text-white border-2 border-white text-[9px] font-black flex items-center justify-center"
                title={`Pernil: ${metrics.totalPernil}`}
              >
                P:{metrics.totalPernil}
              </span>
              <span
                className="w-7 h-7 rounded-full bg-[#b5e550] text-[#113829] border-2 border-white text-[9px] font-black flex items-center justify-center"
                title={`Costela Suína: ${metrics.totalCostelaSuina}`}
              >
                C:{metrics.totalCostelaSuina}
              </span>
            </div>

            <div className="flex items-end gap-1 h-8">
              {[50, 80, 60, 95, 70, 85, 65].map((h, idx) => (
                <div
                  key={idx}
                  style={{ height: `${h}%` }}
                  className={`w-1 rounded-full ${
                    idx % 2 === 0 ? 'bg-[#113829]' : 'bg-[#b5e550]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN BENTO GRID: LEFT/CENTER (8 COLS) + RIGHT CALENDAR/LIST (4 COLS)  */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT / CENTER COLUMN (8 COLS) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {/* 1. ANALYTIC VIEW CARD (Exact layout from reference image) */}
          <div className="bg-white border border-[#e4e9e5] rounded-3xl p-5 sm:p-6 shadow-2xs">
            {/* Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#f4f6f4] flex items-center justify-center text-[#113829]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Visão Analítica de Pedidos & Cortes
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Distribuição proporcional entre Cortes Bovinos, Alcatrão/Costela G e Suíno
                  </p>
                </div>
              </div>

              {/* Filter Segmented Control */}
              <div className="flex items-center gap-1 p-1 bg-[#f4f6f4] rounded-full">
                {[
                  { id: 'all', label: 'Consolidado' },
                  { id: 'bovino', label: 'Bovino & Cortes' },
                  { id: 'suino', label: 'Linha Suína' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAnalyticFilter(tab.id as 'all' | 'bovino' | 'suino')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      analyticFilter === tab.id
                        ? 'bg-[#113829] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upper Analytic Section: Left Breakdown + Right 3 Hatched Proportional Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-6">
              {/* Left Breakdown (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                      +76%
                    </span>
                    <span className="inline-flex items-center text-xs font-extrabold text-emerald-600">
                      <ArrowUpRight className="w-4 h-4" />
                      Rendimento Padrão
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Índice de aproveitamento e giro das {stores.length} lojas
                  </p>
                </div>

                {/* 3 Legend Rows with Square Color Markers */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-xs bg-[#d8ded9] border border-slate-300 shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Diant. / Tras. / Coxão / Alcat.
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {metrics.groupBovinoBase} pçs
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-xs bg-[#b5e550] shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Ped. Alcatrão & Ped. Costela G
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {metrics.totalPedAlcatrao + metrics.totalPedCostelaG} pçs
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-xs bg-[#113829] shrink-0" />
                      <span className="font-semibold text-slate-700">
                        Suíno, Pernil & Costela Suína
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {metrics.groupSuinoTotal} pçs
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 3 Hatched Proportional Blocks (7 cols - Signature Visual from Image) */}
              <div className="lg:col-span-7 relative">
                <div className="grid grid-cols-12 gap-2.5 h-40 items-stretch">
                  {/* Block 1: Soft Gray Hatched Block */}
                  <div
                    className="col-span-4 rounded-2xl p-3.5 flex flex-col justify-between border border-slate-200/80 relative overflow-hidden"
                    style={{
                      backgroundColor: '#eaeeeb',
                      backgroundImage:
                        'repeating-linear-gradient(135deg, rgba(15, 41, 30, 0.06) 0px, rgba(15, 41, 30, 0.06) 6px, transparent 6px, transparent 12px)'
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Cortes Base
                    </span>
                    <div>
                      <div className="text-xl font-black text-slate-800 font-mono">
                        {metrics.pctBovinoBase}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Boi Calc: {metrics.totalBoiCalc}
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Vibrant Lime (#b5e550) Hatched Block */}
                  <div
                    className="col-span-4 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden shadow-xs"
                    style={{
                      backgroundColor: '#b5e550',
                      backgroundImage:
                        'repeating-linear-gradient(135deg, rgba(17, 56, 41, 0.09) 0px, rgba(17, 56, 41, 0.09) 6px, transparent 6px, transparent 12px)'
                    }}
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#113829]">
                      Alcatrão & Cost.G
                    </span>
                    <div>
                      <div className="text-xl font-black text-[#113829] font-mono">
                        {metrics.pctCortesEspeciais}%
                      </div>
                      <div className="text-[10px] text-[#113829]/80 font-mono font-bold">
                        Sujestão: {metrics.totalSugestao}
                      </div>
                    </div>
                  </div>

                  {/* Block 3: Deep Forest Green (#113829) Hatched Block */}
                  <div
                    className="col-span-4 rounded-2xl p-3.5 flex flex-col justify-between text-white relative overflow-hidden shadow-sm"
                    style={{
                      backgroundColor: '#113829',
                      backgroundImage:
                        'repeating-linear-gradient(135deg, rgba(181, 229, 80, 0.12) 0px, rgba(181, 229, 80, 0.12) 6px, transparent 6px, transparent 12px)'
                    }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#b5e550]">
                      Linha Suína
                    </span>
                    <div>
                      <div className="text-xl font-black text-white font-mono">
                        {metrics.pctSuino}%
                      </div>
                      <div className="text-[10px] text-emerald-200 font-mono">
                        Ped. Suíno: {metrics.totalPedidoSuino}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Dark Summary Tooltip Overlay (Matches image's floating dark box) */}
                <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-3 sm:right-4 bg-[#0b241a] text-white rounded-2xl px-4 py-2.5 shadow-xl border border-[#b5e550]/30 flex items-center gap-4 text-xs">
                  <div>
                    <div className="text-[10px] text-emerald-200/80 font-medium">
                      Pedido do Boi Consolidado
                    </div>
                    <div className="font-mono font-black text-sm text-[#b5e550]">
                      {metrics.totalPedidoBoi} Bois · {metrics.totalPedidoSuino} Suínos
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onPrint}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition cursor-pointer"
                  >
                    17 Colunas →
                  </button>
                </div>
              </div>
            </div>

            {/* Lower Analytic Sub-Cards (Matches Gray Overview + Stacked Cards in Image) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3">
              {/* Left Sub-Card: Resumo Operacional (Overview) */}
              <div className="lg:col-span-6 bg-[#f4f6f4] rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-slate-800">
                    Resumo Operacional (17 Colunas)
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('sheet')}
                    className="text-[11px] font-bold text-[#113829] hover:underline cursor-pointer"
                  >
                    Editar Planilha
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/70">
                    <span className="text-slate-600 font-medium">
                      Dianteiro / Traseiro / Coxão / Alcatrão
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {totals.pedidoDianteiro} / {totals.pedidoTraseiro} / {totals.pedidoCoxao} /{' '}
                      {totals.pedidoAlcatrao}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200/70">
                    <span className="text-slate-600 font-medium">
                      Ped. Alcatrão / Cost. G / Ped. Cost. G
                    </span>
                    <span className="font-mono font-bold text-[#113829]">
                      {metrics.totalPedAlcatrao} / {totals.pedidoCostelaGaucha} /{' '}
                      {metrics.totalPedCostelaG}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-600 font-medium">
                      Suíno / Pernil / Cost. Suína / Venda / Pedido
                    </span>
                    <span className="font-mono font-bold text-teal-800">
                      {metrics.totalSuinoCamara} / {metrics.totalPernil} /{' '}
                      {metrics.totalCostelaSuina} / {metrics.totalVendaSuino} /{' '}
                      {metrics.totalPedidoSuino}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Stacked Sub-Cards */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-3">
                {/* Top Sub-Card */}
                <div className="bg-[#f4f6f4] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">
                      Investimento Estimado do Pedido
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Boi Calc: {metrics.totalBoiCalc} · Sugestão: {metrics.totalSugestao}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#113829] font-mono tabular-nums">
                      {formatCurrencyBRL(metrics.estimatedPurchaseBRL)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700">
                      ● 16 Lojas Consolidadas
                    </div>
                  </div>
                </div>

                {/* Bottom Sub-Card with Dark Forest Pill Button */}
                <div className="bg-[#f4f6f4] rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">
                      Relatório Oficial de Pedido
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Exportação em PDF Paisagem, Excel (.XLSX) e WhatsApp
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onPrint}
                    className="px-4 py-2.5 rounded-full bg-[#113829] hover:bg-[#194d38] text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer"
                  >
                    Ver Relatório
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 1.5. PAINEL DE KPIS DE DESOSSA & RENDIMENTO MÉDIO EM TEMPO REAL (ÚLTIMO LOTE) */}
          <DeboningYieldKpiPanel batches={batches} onNavigate={onNavigate} />

          {/* 2. BOTTOM ROW LEFT/CENTER: 100% RATIO CARD + DEEP FOREST FEATURED CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Card: 100% Chamber vs Order Proportion (Matches bottom-left 100% card in image) */}
            <div className="lg:col-span-5 bg-white border border-[#e4e9e5] rounded-3xl p-5 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                    100%
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('inventory')}
                    className="w-8 h-8 rounded-full hover:bg-[#f4f6f4] flex items-center justify-center text-slate-400 cursor-pointer"
                    title="Abrir Controle de Estoque e Câmaras"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  Proporção Câmara Fria vs. Pedido Atual
                </p>

                <div className="flex items-center gap-4 mt-4 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#b5e550]" />
                    <span>Câmara ({metrics.totalCamaraPecas} pç)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-300" />
                    <span>Pedido ({metrics.totalPedidoPecas} pç)</span>
                  </div>
                </div>
              </div>

              {/* Split Horizontal Bar with Center Vertical Pin */}
              <div className="mt-6 pt-2">
                <div className="relative h-12 w-full rounded-2xl bg-[#ebefec] flex items-center overflow-hidden p-1">
                  <div
                    style={{ width: `${metrics.stockRatioPct}%` }}
                    className="h-full bg-[#b5e550] rounded-xl flex items-center px-3 text-xs font-black text-[#113829] font-mono transition-all"
                  >
                    {metrics.stockRatioPct}%
                  </div>
                  {/* Vertical Marker Pin */}
                  <div className="w-1 h-9 bg-[#113829] rounded-full mx-1 shrink-0 shadow-xs" />
                  <div className="flex-1 h-full flex items-center justify-end px-3 text-xs font-black text-slate-700 font-mono">
                    {metrics.orderRatioPct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Deep Forest Green Card with 4 Circular Metric Badges (Matches bottom-center card in image) */}
            <div className="lg:col-span-7 bg-[#113829] text-white rounded-3xl p-5 flex flex-col justify-between shadow-sm">
              {/* Top Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[#b5e550] shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-white truncate">
                      Destaque: {metrics.topRow?.storeName || '01 - JARDIM ALCÂNTARA'}
                    </h4>
                    <p className="text-[11px] text-emerald-200/80 truncate">
                      Encarregado: {metrics.topStore?.manager || 'Equipe GAPP'} · Apuração Arredondada
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#b5e550]/20 text-[#b5e550] font-mono font-bold text-[10px] shrink-0">
                  Top Giro
                </span>
              </div>

              {/* Inner White Card with 4 Circular Badges */}
              <div className="bg-white text-slate-900 rounded-2xl p-4 my-3.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-3">
                  <span>Indicadores Consolidados (Arredondados)</span>
                  <span className="text-[#113829] font-extrabold">16 Filiais</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#f4f6f4] border border-[#dfe5e0] flex items-center justify-center font-mono font-black text-xs text-[#113829]">
                      {metrics.totalBoiCalc}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 mt-1">Boi Calc</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#f4f6f4] border border-[#dfe5e0] flex items-center justify-center font-mono font-black text-xs text-purple-900">
                      {metrics.totalSugestao}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 mt-1">Sujestão</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#113829] text-[#b5e550] flex items-center justify-center font-mono font-black text-xs shadow-2xs">
                      {metrics.totalPedidoBoi}
                    </div>
                    <span className="text-[10px] font-extrabold text-[#113829] mt-1">
                      Pedido Boi
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-full bg-[#b5e550] text-[#113829] flex items-center justify-center font-mono font-black text-xs shadow-2xs">
                      {metrics.totalPedidoSuino}
                    </div>
                    <span className="text-[10px] font-extrabold text-teal-900 mt-1">
                      Ped. Suíno
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom 2 Pill Buttons (Dark Green + Vibrant Lime) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('sheet')}
                  className="py-2.5 px-4 rounded-full bg-[#1b4b38] hover:bg-[#235e47] text-white font-bold text-xs transition cursor-pointer text-center"
                >
                  Abrir Planilha v10.9
                </button>
                <button
                  type="button"
                  onClick={onOpenPurchaseOrder}
                  className="py-2.5 px-4 rounded-full bg-[#b5e550] hover:bg-[#a4d63c] text-[#113829] font-extrabold text-xs transition cursor-pointer text-center shadow-xs"
                >
                  Fechar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN (4 COLS): CALENDAR + STORE LAUNCH CARDS                */}
        {/* =================================================================== */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="bg-white border border-[#e4e9e5] rounded-3xl p-5 flex-1 flex flex-col justify-between shadow-2xs">
            {/* 1. Interactive Monthly Calendar (Matches Top-Right Calendar in Image) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-full bg-[#f4f6f4] hover:bg-[#e4eae5] flex items-center justify-center text-slate-700 transition cursor-pointer"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {MONTH_NAMES_PT[calMonth]} {calYear}
                </h3>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-full bg-[#f4f6f4] hover:bg-[#e4eae5] flex items-center justify-center text-slate-700 transition cursor-pointer"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {WEEKDAYS_PT.map(day => (
                  <div key={day} className="text-[10px] font-bold text-slate-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Circular Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {calendarDays.map((cell, idx) => {
                  const isSelected = cell.isCurrentMonth && cell.day === selectedDay;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!cell.isCurrentMonth}
                      onClick={() => cell.isCurrentMonth && setSelectedDay(cell.day)}
                      className={`h-8 w-8 mx-auto rounded-full text-xs font-mono font-bold flex items-center justify-center transition ${
                        !cell.isCurrentMonth
                          ? 'text-slate-300 cursor-default'
                          : isSelected
                          ? 'bg-[#b5e550] text-[#113829] font-black shadow-xs cursor-pointer'
                          : cell.hasActivity
                          ? 'bg-[#f4f6f4] text-[#113829] border border-[#113829]/25 hover:bg-[#e6ece8] cursor-pointer'
                          : 'text-slate-700 hover:bg-[#f4f6f4] cursor-pointer'
                      }`}
                      style={
                        cell.hasActivity && !isSelected && cell.isCurrentMonth
                          ? {
                              backgroundImage:
                                'repeating-linear-gradient(135deg, rgba(17, 56, 41, 0.07) 0px, rgba(17, 56, 41, 0.07) 3px, transparent 3px, transparent 6px)'
                            }
                          : undefined
                      }
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-[#edf1ee]" />

            {/* 2. Store Activity Cards List (Matches Right-Side Cards in Image) */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-extrabold text-slate-900">
                  Filiais ({filteredStoreRows.length})
                </span>
                <div className="flex items-center gap-1 bg-[#f4f6f4] p-0.5 rounded-full">
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'withOrder', label: 'Com Pedido' },
                    { id: 'suino', label: 'Suíno' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStoreFilter(f.id as 'all' | 'withOrder' | 'suino')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        storeFilter === f.id
                          ? 'bg-[#113829] text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[370px] pr-1">
                {filteredStoreRows.map(r => {
                  const storeObj = stores.find(s => s.id === r.storeId);
                  const boiCalc = Math.round(
                    r.boi !== undefined
                      ? r.boi
                      : (r.pedidoDianteiro +
                          r.pedidoTraseiro +
                          r.pedidoCoxao +
                          r.pedidoAlcatrao) /
                          2
                  );
                  const venda = Math.round(r.venda || r.boiAVenda || 0);
                  const sujestao = Math.round(
                    r.sugestaoPedido !== undefined ? r.sugestaoPedido : venda - boiCalc
                  );
                  const pedidoBoi = r.pedidoFinal !== undefined ? r.pedidoFinal : 0;
                  const pedidoSuino = r.bandaPedido || r.pedidoSuino || 0;
                  const pedAlcatrao = r.pedidoAlcatraoReal || 0;
                  const pedCostelaG = r.pedidoCostelaReal || 0;

                  return (
                    <div
                      key={r.storeId}
                      onClick={() => onNavigate('sheet')}
                      className="bg-[#f4f6f4] hover:bg-[#e9efeb] rounded-2xl p-3.5 transition cursor-pointer border border-transparent hover:border-[#113829]/20"
                    >
                      {/* Top Row: Store Title + Forest Green Pill Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">
                            {r.storeName}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Boi Calc: <strong>{boiCalc}</strong> · Sujestão:{' '}
                            <strong>{sujestao}</strong> · Venda: <strong>{venda}</strong>
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-[#113829] text-white font-mono font-bold text-[10px] whitespace-nowrap shrink-0">
                          Boi: {pedidoBoi} · Suíno: {pedidoSuino}
                        </span>
                      </div>

                      {/* Bottom Row: Overlapping Circular Cut Badges + Manager */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center -space-x-1.5">
                          <span
                            className="w-6 h-6 rounded-full bg-white border border-slate-300 text-[9px] font-mono font-bold text-slate-700 flex items-center justify-center"
                            title={`Dianteiro: ${r.pedidoDianteiro} | Traseiro: ${r.pedidoTraseiro}`}
                          >
                            D{r.pedidoDianteiro}
                          </span>
                          <span
                            className="w-6 h-6 rounded-full bg-white border border-slate-300 text-[9px] font-mono font-bold text-slate-700 flex items-center justify-center"
                            title={`Traseiro: ${r.pedidoTraseiro}`}
                          >
                            T{r.pedidoTraseiro}
                          </span>
                          <span
                            className="w-6 h-6 rounded-full bg-[#b5e550] border border-white text-[9px] font-mono font-black text-[#113829] flex items-center justify-center"
                            title={`Pedido de Alcatrão: ${pedAlcatrao}`}
                          >
                            A{pedAlcatrao}
                          </span>
                          <span
                            className="w-6 h-6 rounded-full bg-[#113829] border border-white text-[9px] font-mono font-bold text-[#b5e550] flex items-center justify-center"
                            title={`Pedido de Costela G: ${pedCostelaG}`}
                          >
                            C{pedCostelaG}
                          </span>
                        </div>

                        <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[130px]">
                          {storeObj?.manager || 'Gerência'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
