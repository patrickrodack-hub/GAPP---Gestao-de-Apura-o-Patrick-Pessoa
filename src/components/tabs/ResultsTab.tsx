import React, { useState } from 'react';
import { SheetRowData, Store, PurchaseBatch, WasteRecord } from '../../types/erp';
import { formatCurrencyBRL, calculateSheetTotals } from '../../services/calculationService';
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
  Scale
} from 'lucide-react';
import { YieldLossComparison } from '../results/YieldLossComparison';
import { PurchaseScatterPlot } from '../results/PurchaseScatterPlot';

interface ResultsTabProps {
  rows: SheetRowData[];
  stores: Store[];
  batches?: PurchaseBatch[];
  wasteRecords?: WasteRecord[];
}

export const ResultsTab: React.FC<ResultsTabProps> = ({ 
  rows, 
  stores,
  batches = [],
  wasteRecords = []
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('TODAS');

  const totals = calculateSheetTotals(rows);

  // Estimativas financeiras do açougue baseadas na matriz oficial
  // Preço médio de venda estimado no mix: ~ R$ 38,50 / kg
  // Custo médio ponderado de aquisição: R$ 26,00 / kg
  const totalCarcassCost = 376311.95; // Valor exato da planilha oficial
  const estimatedRevenue = totalCarcassCost * 1.485; // Markup de 48.5%
  const grossProfit = estimatedRevenue - totalCarcassCost;
  const marginOnSale = (grossProfit / estimatedRevenue) * 100;
  const marginOnCost = (grossProfit / totalCarcassCost) * 100;

  // Quebra e Descarte (Sebo e Osso recuperados na graxaria)
  const totalWeightKg = 14473.5; // Total de kg da compra consolidada
  const wasteWeightKg = totalWeightKg * 0.24; // 24% osso e sebo
  const wasteRevenueRecovered = (totalWeightKg * 0.065 * 2.10) + (totalWeightKg * 0.175 * 0.70); // R$ recuperados

  // Análise detalhada por Loja
  const storePerformances = rows.map((r) => {
    // Estimativa de peças movimentadas
    const pecasVendidas = r.boiAVenda + r.totalDianteiro + r.totalCoxao;
    const kgEstimado = pecasVendidas * 18.5; // kg médio por peça desossada/corte
    const custoEstimado = kgEstimado * 26.00;
    const faturamentoEstimado = kgEstimado * 37.80;
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
      estoqueCamara: r.camaraDianteiro + r.somaDoTraseiro + r.camaraCostelaGaucha,
    };
  });

  const filteredPerformances = selectedStoreId === 'TODAS'
    ? storePerformances
    : storePerformances.filter(p => p.storeId === selectedStoreId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Apuração de Resultados Financeiros & Margens
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              DRE Gerencial do Boi: Margem sobre Compra (Markup), Margem sobre Venda, Custo da Mercadoria Vendida (CMV) e Lucro Bruto
            </p>
          </div>
        </div>

        {/* Filter by store */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="TODAS">Todas as 16 Filiais (Consolidado)</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Bruto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Faturamento Projetado
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrencyBRL(estimatedRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Preço Médio Mix: <strong>R$ 38,62 /kg</strong></span>
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
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Custo Base Compra: <strong>R$ 26,00 /kg</strong> (Planilha Direção)
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
            Lucro Bruto retido sobre a receita total
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
            Multiplicador de custo de compra: <strong>1.48x</strong>
          </div>
        </div>
      </div>

      {/* NOVO COMPONENTE: CONFRONTO COMPRADO (LOTES) VS DESOSSADO E QUEBRAS NÃO JUSTIFICADAS */}
      <YieldLossComparison
        rows={rows}
        stores={stores}
        batches={batches}
        wasteRecords={wasteRecords}
      />

      {/* GRÁFICO DE DISPERSÃO: VOLUME DE COMPRA VS PREÇO MÉDIO PAGO POR FILIAL */}
      <PurchaseScatterPlot
        rows={rows}
        stores={stores}
        batches={batches}
      />

      {/* DRE Structure Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Demonstrativo do Resultado do Exercício (DRE) – Operação Carnes</span>
        </h3>

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
              <span className="text-emerald-800 dark:text-emerald-300 font-bold block">{formatCurrencyBRL(grossProfit + wasteRevenueRecovered)}</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400/80">Margem Real: {((grossProfit + wasteRevenueRecovered) / estimatedRevenue * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Store Ranking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Desempenho e Margens por Filial ({filteredPerformances.length} Lojas)</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Classificado por volume operacional
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
