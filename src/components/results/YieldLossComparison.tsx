import React, { useState, useMemo } from 'react';
import { SheetRowData, Store, PurchaseBatch, WasteRecord } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR, CutYieldWeights, DEFAULT_CUT_YIELD_WEIGHTS } from '../../services/calculationService';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Beef, 
  Bone, 
  Warehouse, 
  Search, 
  Filter, 
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

interface YieldLossComparisonProps {
  rows: SheetRowData[];
  stores: Store[];
  batches?: PurchaseBatch[];
  wasteRecords?: WasteRecord[];
  cutWeights?: CutYieldWeights;
}

export const YieldLossComparison: React.FC<YieldLossComparisonProps> = ({
  rows,
  stores,
  batches = [],
  wasteRecords = [],
  cutWeights = DEFAULT_CUT_YIELD_WEIGHTS
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'ATTENTION' | 'NORMAL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreModal, setSelectedStoreModal] = useState<any | null>(null);

  // Preço médio do custo de compra da carcaça por kg
  const COST_PER_KG = 26.00;

  // -------------------------------------------------------------
  // CÁLCULO DA RECONCILIAÇÃO POR FILIAL (COMPRADO VS DESOSSADO)
  // -------------------------------------------------------------
  const reconciliationData = useMemo(() => {
    return rows.map((row) => {
      const store = stores.find(s => s.id === row.storeId);
      const storeName = store ? store.name : row.storeName;

      // 1. VOLUME COMPRADO / DESTINADO (KG)
      // Base: soma dos pedidos da loja ou lote de compras alocado (boi = carcaça equivalente ~240kg)
      const boisComprados = (row.pedidoDianteiro + row.pedidoTraseiro + row.pedidoCoxao + row.pedidoAlcatrao) / 2;
      const volumeCompradoKg = boisComprados > 0 
        ? boisComprados * 240 
        : (row.boiAVenda > 0 ? row.boiAVenda * 240 : 1200);

      const custoCompraTotal = volumeCompradoKg * COST_PER_KG;

      // 2. VOLUME DESOSSADO EM BALCÃO (CARNE LIMPA EM KG)
      // Soma de todos os cortes nobres, dianteiro e traseiro
      const cortesNobresKg = (row.alcatraKg || (row.alcatra * cutWeights.alcatra)) +
                            (row.contraFileKg || (row.contraFile * cutWeights.contraFile)) +
                            (row.picanhaKg || (row.picanha * cutWeights.picanha)) +
                            (row.fileMignonKg || (row.fileMignon * cutWeights.fileMignon));

      const cortesDianteiroKg = (row.paletaKg || (row.paletaPecas * cutWeights.paleta)) +
                               (row.acemKg || (row.acemPecas * cutWeights.acem)) +
                               (row.peitoKg || (row.peitoPecas * cutWeights.peito)) +
                               (row.musculoKg || (row.musculoPecas * cutWeights.musculo));

      const cortesTraseiroKg = (row.chaKg || (row.chaPecas * cutWeights.cha)) +
                              (row.patinhoKg || (row.patinhoPecas * cutWeights.patinho)) +
                              (row.lagartoRedondoKg || (row.lagartoRedondoPecas * cutWeights.lagartoRedondo)) +
                              (row.lagartoPlanoKg || (row.lagartoPlanoPecas * cutWeights.lagartoPlano));

      const carneLimpaKg = cortesNobresKg + cortesDianteiroKg + cortesTraseiroKg;

      // 3. DESCARTE JUSTIFICADO (SEBO E OSSO APURADOS)
      // Verifica se há registros reais de pesagem na filial, caso contrário usa o padrão técnico de 24% da desossa comercial
      const storeWasteRecords = wasteRecords.filter(w => w.storeId === row.storeId);
      let seboKg = 0;
      let ossoKg = 0;
      
      if (storeWasteRecords.length > 0) {
        seboKg = storeWasteRecords.reduce((acc, w) => acc + (w.fatWeightKg || 0), 0);
        ossoKg = storeWasteRecords.reduce((acc, w) => acc + (w.boneWeightKg || 0), 0);
      } else {
        // Padrão técnico: 6.5% sebo e 17.5% osso (total 24%)
        seboKg = volumeCompradoKg * 0.065;
        ossoKg = volumeCompradoKg * 0.175;
      }
      const descarteTotalKg = seboKg + ossoKg;

      // 4. ESTOQUE RETIDO EM CÂMARA FRIA (KG EQUIVALENTE)
      // Peças inteiras penduradas (Quarto Traseiro ~60kg, Dianteiro ~60kg, Costela ~25kg, Coxão/Alcatrão ~30kg)
      const camaraDiantKg = row.camaraDianteiro * 60;
      const camaraTrasKg = row.camaraTraseiro * 60;
      const camaraCoxKg = row.camaraCoxao * 35;
      const camaraAlcKg = row.camaraAlcatrao * 22;
      const camaraCostKg = row.camaraCostelaGaucha * 25;
      const estoqueCamaraKg = camaraDiantKg + camaraTrasKg + camaraCoxKg + camaraAlcKg + camaraCostKg;

      // 5. VOLUME TOTAL APURADO
      // Total de peso físico rastreado na loja
      const volumeApuradoKg = carneLimpaKg + descarteTotalKg + estoqueCamaraKg;

      // 6. DIVERGÊNCIA / QUEBRA NÃO JUSTIFICADA
      // Se o volume apurado for menor que o comprado, temos perda não justificada
      const quebraKg = Math.max(0, volumeCompradoKg - volumeApuradoKg);
      const quebraPercent = volumeCompradoKg > 0 ? (quebraKg / volumeCompradoKg) * 100 : 0;
      const perdaFinanceiraR$ = quebraKg * COST_PER_KG;

      // Rendimento apurado de carne limpa
      const rendimentoCarnePercent = volumeCompradoKg > 0 ? (carneLimpaKg / volumeCompradoKg) * 100 : 0;

      // 7. STATUS DE AUDITORIA
      // Tolerância aceitável de quebra operacional por desidratação/gotejamento: até 1.8%
      let status: 'NORMAL' | 'ATTENTION' | 'CRITICAL' = 'NORMAL';
      if (quebraPercent > 3.0) {
        status = 'CRITICAL';
      } else if (quebraPercent > 1.8) {
        status = 'ATTENTION';
      }

      return {
        storeId: row.storeId,
        storeName,
        manager: store?.manager || 'Encarregado',
        city: store?.city || '',
        boisComprados,
        volumeCompradoKg,
        custoCompraTotal,
        carneLimpaKg,
        descarteTotalKg,
        seboKg,
        ossoKg,
        estoqueCamaraKg,
        volumeApuradoKg,
        quebraKg,
        quebraPercent,
        perdaFinanceiraR$,
        rendimentoCarnePercent,
        status,
        cortesNobresKg,
        cortesDianteiroKg,
        cortesTraseiroKg
      };
    });
  }, [rows, stores, batches, wasteRecords, cutWeights]);

  // Totais consolidados
  const totals = useMemo(() => {
    const totalCompradoKg = reconciliationData.reduce((acc, r) => acc + r.volumeCompradoKg, 0);
    const totalCarneLimpaKg = reconciliationData.reduce((acc, r) => acc + r.carneLimpaKg, 0);
    const totalDescarteKg = reconciliationData.reduce((acc, r) => acc + r.descarteTotalKg, 0);
    const totalCamaraKg = reconciliationData.reduce((acc, r) => acc + r.estoqueCamaraKg, 0);
    const totalApuradoKg = reconciliationData.reduce((acc, r) => acc + r.volumeApuradoKg, 0);
    const totalQuebraKg = reconciliationData.reduce((acc, r) => acc + r.quebraKg, 0);
    const totalPerdaR$ = reconciliationData.reduce((acc, r) => acc + r.perdaFinanceiraR$, 0);
    const quebraPercentGeral = totalCompradoKg > 0 ? (totalQuebraKg / totalCompradoKg) * 100 : 0;
    const rendimentoCarneGeral = totalCompradoKg > 0 ? (totalCarneLimpaKg / totalCompradoKg) * 100 : 0;

    const criticalCount = reconciliationData.filter(r => r.status === 'CRITICAL').length;
    const attentionCount = reconciliationData.filter(r => r.status === 'ATTENTION').length;
    const normalCount = reconciliationData.filter(r => r.status === 'NORMAL').length;

    return {
      totalCompradoKg,
      totalCarneLimpaKg,
      totalDescarteKg,
      totalCamaraKg,
      totalApuradoKg,
      totalQuebraKg,
      totalPerdaR$,
      quebraPercentGeral,
      rendimentoCarneGeral,
      criticalCount,
      attentionCount,
      normalCount
    };
  }, [reconciliationData]);

  // Filtro
  const filteredList = useMemo(() => {
    return reconciliationData.filter(item => {
      const matchSearch = item.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [reconciliationData, searchTerm, filterStatus]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Auditoria de Rendimento & Reconciliação de Desossa
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Comprado vs Desossado
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confronto entre carcaças faturadas (kg), cortes obtidos no balcão, descarte de sebo/osso e perdas não justificadas
            </p>
          </div>
        </div>

        {/* Global Alert Badge */}
        <div className="flex items-center gap-2">
          {totals.criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-bold animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>{totals.criticalCount} {totals.criticalCount === 1 ? 'Loja com Quebra Crítica' : 'Lojas com Quebra Crítica'}</span>
            </div>
          )}
          <div className="text-right font-mono text-xs">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">Perda Total Não Justificada</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
              {formatCurrencyBRL(totals.totalPerdaR$)} ({totals.totalQuebraKg.toFixed(1)} kg)
            </span>
          </div>
        </div>
      </div>

      {/* 4 Cards de Resumo da Auditoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Volume Comprado */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Volume Comprado (Lotes)</span>
            <Beef className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {totals.totalCompradoKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <span className="text-xs font-normal">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Custo Base: {formatCurrencyBRL(totals.totalCompradoKg * COST_PER_KG)}
          </div>
        </div>

        {/* 2. Carne Limpa Desossada */}
        <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
            <span>Carne Limpa Desossada</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {totals.totalCarneLimpaKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <span className="text-xs font-normal">kg</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            Rendimento: {totals.rendimentoCarneGeral.toFixed(1)}% da carcaça
          </div>
        </div>

        {/* 3. Descarte Justificado (Sebo e Osso) */}
        <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
            <span>Subprodutos (Sebo + Osso)</span>
            <Bone className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
            {totals.totalDescarteKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <span className="text-xs font-normal">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
            Graxaria: ~{((totals.totalDescarteKg / totals.totalCompradoKg) * 100).toFixed(1)}% esperado
          </div>
        </div>

        {/* 4. Quebra Não Justificada */}
        <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800 dark:text-rose-300 mb-1">
            <span>Quebra / Rombo Não Justificado</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {totals.totalQuebraKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} <span className="text-xs font-normal">kg</span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between">
            <span>Divergência: {totals.quebraPercentGeral.toFixed(2)}%</span>
            <span>{formatCurrencyBRL(totals.totalPerdaR$)}</span>
          </div>
        </div>
      </div>

      {/* Barra Visual de Distribuição do Peso */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          <span>Composição do Volume Total Comprado ({totals.totalCompradoKg.toFixed(0)} kg = 100%)</span>
          <span className="text-[11px] font-normal text-slate-500">Balanço de Massa Físico da Desossa</span>
        </div>

        <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {/* Carne Limpa */}
          <div 
            className="h-full bg-emerald-500 hover:bg-emerald-400 transition" 
            style={{ width: `${(totals.totalCarneLimpaKg / totals.totalCompradoKg) * 100}%` }}
            title={`Carne Limpa: ${totals.totalCarneLimpaKg.toFixed(1)} kg (${((totals.totalCarneLimpaKg / totals.totalCompradoKg) * 100).toFixed(1)}%)`}
          />
          {/* Sebo e Osso */}
          <div 
            className="h-full bg-amber-500 hover:bg-amber-400 transition" 
            style={{ width: `${(totals.totalDescarteKg / totals.totalCompradoKg) * 100}%` }}
            title={`Descarte Sebo/Osso: ${totals.totalDescarteKg.toFixed(1)} kg (${((totals.totalDescarteKg / totals.totalCompradoKg) * 100).toFixed(1)}%)`}
          />
          {/* Câmara */}
          <div 
            className="h-full bg-blue-500 hover:bg-blue-400 transition" 
            style={{ width: `${(totals.totalCamaraKg / totals.totalCompradoKg) * 100}%` }}
            title={`Estoque em Câmara: ${totals.totalCamaraKg.toFixed(1)} kg (${((totals.totalCamaraKg / totals.totalCompradoKg) * 100).toFixed(1)}%)`}
          />
          {/* Quebra */}
          {totals.totalQuebraKg > 0 && (
            <div 
              className="h-full bg-red-500 hover:bg-red-400 transition animate-pulse" 
              style={{ width: `${(totals.totalQuebraKg / totals.totalCompradoKg) * 100}%` }}
              title={`Quebra Não Justificada: ${totals.totalQuebraKg.toFixed(1)} kg (${totals.quebraPercentGeral.toFixed(1)}%)`}
            />
          )}
        </div>

        {/* Legenda da barra */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] mt-2 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Carne Limpa: {((totals.totalCarneLimpaKg / totals.totalCompradoKg) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Sebo & Osso: {((totals.totalDescarteKg / totals.totalCompradoKg) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Câmara Fria: {((totals.totalCamaraKg / totals.totalCompradoKg) * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Quebra / Rombo: {totals.quebraPercentGeral.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filtrar por Status:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                filterStatus === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todas ({reconciliationData.length})
            </button>
            <button
              onClick={() => setFilterStatus('CRITICAL')}
              className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 ${
                filterStatus === 'CRITICAL'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
              }`}
            >
              <span>Crítica (&gt;3%)</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/20">{totals.criticalCount}</span>
            </button>
            <button
              onClick={() => setFilterStatus('ATTENTION')}
              className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 ${
                filterStatus === 'ATTENTION'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <span>Atenção</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/20">{totals.attentionCount}</span>
            </button>
            <button
              onClick={() => setFilterStatus('NORMAL')}
              className={`px-2.5 py-1 rounded font-semibold transition flex items-center gap-1 ${
                filterStatus === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <span>Normal</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-white/20">{totals.normalCount}</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar filial ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500 w-56"
          />
        </div>
      </div>

      {/* Tabela de Reconciliação por Filial */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
            <tr>
              <th className="px-3.5 py-3">Filial / Responsável</th>
              <th className="px-3 py-3 text-right">Comprado (kg)</th>
              <th className="px-3 py-3 text-right text-emerald-800 dark:text-emerald-300">Carne Limpa (kg)</th>
              <th className="px-3 py-3 text-right text-amber-800 dark:text-amber-300">Sebo/Osso (kg)</th>
              <th className="px-3 py-3 text-right text-blue-800 dark:text-blue-300">Câmara (kg)</th>
              <th className="px-3 py-3 text-right">Apurado Total</th>
              <th className="px-3 py-3 text-right text-rose-700 dark:text-rose-400 font-bold">Quebra (kg)</th>
              <th className="px-3 py-3 text-right text-rose-700 dark:text-rose-400 font-bold">Quebra (%)</th>
              <th className="px-3 py-3 text-right text-rose-700 dark:text-rose-400 font-bold">Prejuízo R$</th>
              <th className="px-3 py-3 text-center">Auditoria</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
            {filteredList.map((item) => (
              <tr 
                key={item.storeId} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                  item.status === 'CRITICAL' ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                }`}
                onClick={() => setSelectedStoreModal(item)}
              >
                <td className="px-3.5 py-2.5 font-sans">
                  <div className="font-bold text-slate-900 dark:text-white">{item.storeName}</div>
                  <div className="text-[10px] text-slate-500">{item.city} • {item.manager}</div>
                </td>

                <td className="px-3 py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                  {item.volumeCompradoKg.toFixed(1)}
                </td>

                <td className="px-3 py-2.5 text-right text-emerald-700 dark:text-emerald-400 font-semibold">
                  {item.carneLimpaKg.toFixed(1)}
                  <span className="text-[10px] block opacity-75">{item.rendimentoCarnePercent.toFixed(1)}%</span>
                </td>

                <td className="px-3 py-2.5 text-right text-amber-700 dark:text-amber-400">
                  {item.descarteTotalKg.toFixed(1)}
                </td>

                <td className="px-3 py-2.5 text-right text-blue-700 dark:text-blue-400">
                  {item.estoqueCamaraKg.toFixed(1)}
                </td>

                <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                  {item.volumeApuradoKg.toFixed(1)}
                </td>

                <td className={`px-3 py-2.5 text-right font-bold ${
                  item.quebraKg > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}>
                  {item.quebraKg > 0 ? `-${item.quebraKg.toFixed(1)} kg` : '0,0 kg'}
                </td>

                <td className={`px-3 py-2.5 text-right font-bold ${
                  item.status === 'CRITICAL' ? 'text-red-600 dark:text-red-400 text-sm' : 
                  item.status === 'ATTENTION' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {item.quebraPercent.toFixed(2)}%
                </td>

                <td className={`px-3 py-2.5 text-right font-bold ${
                  item.perdaFinanceiraR$ > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}>
                  {item.perdaFinanceiraR$ > 0 ? `-${formatCurrencyBRL(item.perdaFinanceiraR$)}` : 'R$ 0,00'}
                </td>

                <td className="px-3 py-2.5 text-center font-sans">
                  {item.status === 'CRITICAL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                      <AlertTriangle className="w-3 h-3" /> Quebra Crítica
                    </span>
                  )}
                  {item.status === 'ATTENTION' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <Info className="w-3 h-3" /> Atenção
                    </span>
                  )}
                  {item.status === 'NORMAL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Conforme
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Diagnóstico Operacional de Quebras */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span>Guia de Diagnóstico & Causas Comuns de Quebras de Desossa</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">1. Desidratação & Gotejamento (&gt;1.5%)</strong>
            Permanência prolongada das peças na câmara fria com ventilação excessiva ou variações térmicas diárias.
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">2. Toalete Excessiva no Balcão</strong>
            Limpeza exagerada dos cortes sem o devido registro e pesagem de sebo/aparas na graxaria.
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">3. Divergência na Entrada do Frigorífico</strong>
            Diferença entre o peso da carcaça faturada na NF e a pesagem real do gancho no recebimento da loja.
          </div>
        </div>
      </div>

      {/* Modal de Detalhamento da Loja */}
      {selectedStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Detalhamento de Rendimento: {selectedStoreModal.storeName}
                </h3>
                <p className="text-xs text-slate-500">{selectedStoreModal.city} • Gerente: {selectedStoreModal.manager}</p>
              </div>
              <button 
                onClick={() => setSelectedStoreModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-950">
                <span className="font-sans text-slate-600 dark:text-slate-400">Volume Comprado (Entrada):</span>
                <strong className="text-slate-900 dark:text-white">{selectedStoreModal.volumeCompradoKg.toFixed(1)} kg</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                <span className="font-sans">Cortes Nobres (Alcatra, Contra, Picanha, Mignon):</span>
                <strong>{selectedStoreModal.cortesNobresKg.toFixed(1)} kg</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
                <span className="font-sans">Cortes Dianteiro (Paleta, Acém, Peito, Músculo):</span>
                <strong>{selectedStoreModal.cortesDianteiroKg.toFixed(1)} kg</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                <span className="font-sans">Cortes Traseiro (Chã, Patinho, Lagarto):</span>
                <strong>{selectedStoreModal.cortesTraseiroKg.toFixed(1)} kg</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                <span className="font-sans">Descarte Justificado (Sebo & Osso):</span>
                <strong>{selectedStoreModal.descarteTotalKg.toFixed(1)} kg</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                <span className="font-sans">Estoque Pendurado em Câmara Fria:</span>
                <strong>{selectedStoreModal.estoqueCamaraKg.toFixed(1)} kg</strong>
              </div>

              <div className={`flex justify-between p-3 rounded-lg border text-sm font-bold ${
                selectedStoreModal.quebraKg > 0 
                  ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}>
                <span className="font-sans">Diferença / Quebra Não Justificada:</span>
                <span>{selectedStoreModal.quebraKg.toFixed(1)} kg ({selectedStoreModal.quebraPercent.toFixed(2)}%)</span>
              </div>

              {selectedStoreModal.perdaFinanceiraR$ > 0 && (
                <div className="text-right text-rose-600 dark:text-rose-400 text-xs font-bold">
                  Prejuízo Financeiro Estimado: -{formatCurrencyBRL(selectedStoreModal.perdaFinanceiraR$)}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStoreModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
