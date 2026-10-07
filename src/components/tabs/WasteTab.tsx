import React, { useState, useEffect } from 'react';
import { WasteRecord, Store, YieldParams } from '../../types/erp';
import { formatCurrencyBRL } from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { 
  Bone, 
  Trash2, 
  Plus, 
  Recycle, 
  Truck, 
  DollarSign, 
  Eye,
  Pencil,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Scale,
  TrendingUp,
  X
} from 'lucide-react';

interface WasteTabProps {
  wasteRecords: WasteRecord[];
  stores: Store[];
  onAddWasteRecord: (record: WasteRecord) => void;
  onUpdateWasteRecord?: (record: WasteRecord) => void;
  onDeleteWasteRecord?: (recordId: string) => void;
  yieldParams?: YieldParams;
  onUpdateYieldParams?: (params: any) => void;
}

export const WasteTab: React.FC<WasteTabProps> = ({ 
  wasteRecords, 
  stores, 
  onAddWasteRecord,
  onUpdateWasteRecord,
  onDeleteWasteRecord,
  yieldParams,
  onUpdateYieldParams
}) => {
  // Modal de Criação
  const [showModal, setShowModal] = useState(false);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [carcassWeight, setCarcassWeight] = useState(1500);
  const [boneWeight, setBoneWeight] = useState(255); // ~17.0%
  const [fatWeight, setFatWeight] = useState(97.5);   // ~6.5%
  const [bonePrice, setBonePrice] = useState(() => yieldParams?.bonePriceKg || 0.90);
  const [fatPrice, setFatPrice] = useState(() => yieldParams?.fatPriceKg || 4.85);
  const [renderingPlant, setRenderingPlant] = useState('Graxaria Fluminense Ltda');

  // Modal de Visualização Detalhada
  const [viewingRecord, setViewingRecord] = useState<WasteRecord | null>(null);

  // Modal de Edição
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStoreId, setEditStoreId] = useState('');
  const [editRenderingPlant, setEditRenderingPlant] = useState('');
  const [editCarcassWeight, setEditCarcassWeight] = useState(0);
  const [editFatWeight, setEditFatWeight] = useState(0);
  const [editBoneWeight, setEditBoneWeight] = useState(0);
  const [editFatPrice, setEditFatPrice] = useState(0);
  const [editBonePrice, setEditBonePrice] = useState(0);

  // Modal de Exclusão
  const [deletingRecord, setDeletingRecord] = useState<WasteRecord | null>(null);

  useEffect(() => {
    if (yieldParams) {
      if (yieldParams.bonePriceKg > 0) setBonePrice(yieldParams.bonePriceKg);
      if (yieldParams.fatPriceKg > 0) setFatPrice(yieldParams.fatPriceKg);
    }
  }, [yieldParams]);

  // Cálculos do modal de criação
  const totalFatRevenue = fatWeight * fatPrice;
  const totalBoneRevenue = boneWeight * bonePrice;
  const totalWasteWeight = boneWeight + fatWeight;
  const wastePercent = carcassWeight > 0 ? (totalWasteWeight / carcassWeight) * 100 : 0;

  // Cálculos do modal de edição
  const editTotalFatRevenue = editFatWeight * editFatPrice;
  const editTotalBoneRevenue = editBoneWeight * editBonePrice;
  const editTotalWasteWeight = editBoneWeight + editFatWeight;
  const editWastePercent = editCarcassWeight > 0 ? (editTotalWasteWeight / editCarcassWeight) * 100 : 0;

  // Abrir Modal de Edição pré-populado
  const handleOpenEdit = (rec: WasteRecord) => {
    setEditingRecord(rec);
    setEditDate(rec.date || new Date().toISOString().split('T')[0]);
    setEditStoreId(rec.storeId);
    setEditRenderingPlant(rec.renderingPlant || 'Graxaria Fluminense Ltda');
    setEditCarcassWeight(rec.carcassOriginWeightKg || 0);
    setEditFatWeight(rec.fatWeightKg || 0);
    setEditBoneWeight(rec.boneWeightKg || 0);
    setEditFatPrice(rec.fatSalePriceKg || 2.10);
    setEditBonePrice(rec.boneSalePriceKg || 0.70);
    // Fecha o de visualização se estiver aberto
    setViewingRecord(null);
  };

  // Submit Criação
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: WasteRecord = {
      id: `wst-${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      storeId,
      carcassOriginWeightKg: Number(carcassWeight),
      fatWeightKg: Number(fatWeight),
      boneWeightKg: Number(boneWeight),
      fatSalePriceKg: Number(fatPrice),
      boneSalePriceKg: Number(bonePrice),
      fatRevenueR$: Number(totalFatRevenue.toFixed(2)),
      boneRevenueR$: Number(totalBoneRevenue.toFixed(2)),
      wastePercent: Number(wastePercent.toFixed(1)),
      renderingPlant
    };
    onAddWasteRecord(newRecord);

    // Assume os novos preços de sebo e osso nos parâmetros globais de rendimento
    if (yieldParams) {
      const updatedParams = {
        ...yieldParams,
        bonePriceKg: Number(bonePrice),
        fatPriceKg: Number(fatPrice)
      };
      StorageService.saveYieldParams(updatedParams);
      if (onUpdateYieldParams) {
        onUpdateYieldParams(updatedParams);
      }
    }

    setShowModal(false);
  };

  // Submit Edição
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const updatedRecord: WasteRecord = {
      ...editingRecord,
      date: editDate,
      storeId: editStoreId,
      renderingPlant: editRenderingPlant,
      carcassOriginWeightKg: Number(editCarcassWeight),
      fatWeightKg: Number(editFatWeight),
      boneWeightKg: Number(editBoneWeight),
      fatSalePriceKg: Number(editFatPrice),
      boneSalePriceKg: Number(editBonePrice),
      fatRevenueR$: Number(editTotalFatRevenue.toFixed(2)),
      boneRevenueR$: Number(editTotalBoneRevenue.toFixed(2)),
      wastePercent: Number(editWastePercent.toFixed(1))
    };

    if (onUpdateWasteRecord) {
      onUpdateWasteRecord(updatedRecord);
    } else {
      StorageService.saveSingleWasteRecord(updatedRecord);
    }

    setEditingRecord(null);
  };

  // Confirmar Exclusão
  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    if (onDeleteWasteRecord) {
      onDeleteWasteRecord(deletingRecord.id);
    } else {
      StorageService.deleteWasteRecord(deletingRecord.id);
    }
    setDeletingRecord(null);
  };

  const consolidatedBoneWeight = wasteRecords.reduce((acc, r) => acc + (r.boneWeightKg || 0), 0);
  const consolidatedFatWeight = wasteRecords.reduce((acc, r) => acc + (r.fatWeightKg || 0), 0);
  const consolidatedRevenue = wasteRecords.reduce((acc, r) => acc + ((r.fatRevenueR$ || 0) + (r.boneRevenueR$ || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <Bone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Controle de Descarte & Subprodutos (Sebo e Osso)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestão de resíduos de desossa, pesagem de ossos e sebo, venda para graxarias e amortização no custo da carne
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDate(new Date().toISOString().split('T')[0]);
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Coleta de Descarte</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Volume Total de Osso
            </span>
            <Bone className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {consolidatedBoneWeight.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kg</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Destinado para farinha de osso e suplementação animal
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Volume Total de Sebo
            </span>
            <Recycle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {consolidatedFatWeight.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">kg</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Gordura industrial para saboaria e biocombustível
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Receita Recuperada com Graxaria
            </span>
            <DollarSign className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {formatCurrencyBRL(consolidatedRevenue)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Valor abatido diretamente do custo das carcaças
          </span>
        </div>
      </div>

      {/* Waste Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Coletas de Graxaria Registradas por Filial</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {wasteRecords.length} {wasteRecords.length === 1 ? 'coleta' : 'coletas'} no sistema
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Data / Filial</th>
                <th className="px-4 py-3">Graxaria Destino</th>
                <th className="px-3 py-3 text-right">Carcaça Origem (kg)</th>
                <th className="px-3 py-3 text-right">Sebo (kg)</th>
                <th className="px-3 py-3 text-right">Osso (kg)</th>
                <th className="px-3 py-3 text-right">% Descarte</th>
                <th className="px-3 py-3 text-right">Receita Sebo</th>
                <th className="px-3 py-3 text-right">Receita Osso</th>
                <th className="px-4 py-3 text-right">Total Recuperado</th>
                <th className="px-4 py-3 text-center w-36">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {wasteRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-slate-400 font-sans">
                    Nenhuma coleta de graxaria registrada ainda. Clique em "Registrar Coleta de Descarte" para lançar.
                  </td>
                </tr>
              ) : (
                wasteRecords.map((rec) => {
                  const store = stores.find(s => s.id === rec.storeId);
                  const totalRowRecovered = (rec.fatRevenueR$ || 0) + (rec.boneRevenueR$ || 0);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-sans">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{store?.name || rec.storeId}</div>
                        <div className="text-[10px] text-slate-500">{rec.date}</div>
                      </td>

                      <td className="px-4 py-3 font-sans text-slate-700 dark:text-slate-300">
                        {rec.renderingPlant}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                        {(rec.carcassOriginWeightKg || 0).toLocaleString('pt-BR')} kg
                      </td>

                      <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {rec.fatWeightKg} kg
                      </td>

                      <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400 font-bold">
                        {rec.boneWeightKg} kg
                      </td>

                      <td className="px-3 py-3 text-right font-bold text-rose-600 dark:text-rose-300">
                        {rec.wastePercent}%
                      </td>

                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrencyBRL(rec.fatRevenueR$ || 0)}
                      </td>

                      <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                        {formatCurrencyBRL(rec.boneRevenueR$ || 0)}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyBRL(totalRowRecovered)}
                      </td>

                      <td className="px-4 py-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botão Visualizar */}
                          <button
                            type="button"
                            onClick={() => setViewingRecord(rec)}
                            title="Visualizar Detalhes da Coleta"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Ver</span>
                          </button>

                          {/* Botão Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(rec)}
                            title="Editar Coleta de Descarte"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Editar</span>
                          </button>

                          {/* Botão Excluir */}
                          <button
                            type="button"
                            onClick={() => setDeletingRecord(rec)}
                            title="Excluir Coleta"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. MODAL VISUALIZAR DETALHES DA COLETA     */}
      {/* ========================================== */}
      {viewingRecord && (() => {
        const store = stores.find(s => s.id === viewingRecord.storeId);
        const totalFatRev = viewingRecord.fatRevenueR$ || 0;
        const totalBoneRev = viewingRecord.boneRevenueR$ || 0;
        const totalRev = totalFatRev + totalBoneRev;
        const totalWeight = (viewingRecord.fatWeightKg || 0) + (viewingRecord.boneWeightKg || 0);
        const carcassW = viewingRecord.carcassOriginWeightKg || 1;
        const fatPct = ((viewingRecord.fatWeightKg || 0) / carcassW) * 100;
        const bonePct = ((viewingRecord.boneWeightKg || 0) / carcassW) * 100;

        return (
          <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-white transition-colors animate-scale-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                    <Eye className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-400/30 font-bold">
                      Comprovante de Coleta & Descarte
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {store?.name || viewingRecord.storeId}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-xs">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Data da Coleta</span>
                    <strong className="text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {viewingRecord.date}
                    </strong>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Graxaria Destino</span>
                    <strong className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate" title={viewingRecord.renderingPlant}>
                      <Truck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{viewingRecord.renderingPlant}</span>
                    </strong>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Carcaça Origem</span>
                    <strong className="text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                      <Scale className="w-3.5 h-3.5 text-amber-500" />
                      {viewingRecord.carcassOriginWeightKg.toLocaleString('pt-BR')} kg
                    </strong>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">% Descarte Total</span>
                    <strong className="text-xs font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                      {viewingRecord.wastePercent}%
                    </strong>
                  </div>
                </div>

                {/* Subprodutos Discriminados */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Recycle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Detalhamento dos Subprodutos Coletados</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Peso Total: {totalWeight.toLocaleString('pt-BR')} kg
                    </span>
                  </div>

                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/50 dark:bg-slate-900 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-3 py-2 text-right">Peso (kg)</th>
                        <th className="px-3 py-2 text-right">% Carcaça</th>
                        <th className="px-3 py-2 text-right">Preço Unit.</th>
                        <th className="px-4 py-2 text-right">Receita Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                      <tr>
                        <td className="px-4 py-2.5 font-sans font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Sebo Industrial (Gordura)
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {viewingRecord.fatWeightKg} kg
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-500">
                          {fatPct.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">
                          {formatCurrencyBRL(viewingRecord.fatSalePriceKg)}/kg
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyBRL(totalFatRev)}
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-2.5 font-sans font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          Ossos de Desossa (Farinha)
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                          {viewingRecord.boneWeightKg} kg
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-500">
                          {bonePct.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-400">
                          {formatCurrencyBRL(viewingRecord.boneSalePriceKg)}/kg
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrencyBRL(totalBoneRev)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-100/80 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 font-bold">
                      <tr>
                        <td className="px-4 py-2.5 font-sans text-slate-900 dark:text-white">
                          Total Recuperado no Lote:
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-900 dark:text-white font-mono">
                          {totalWeight} kg
                        </td>
                        <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400 font-mono">
                          {viewingRecord.wastePercent}%
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-500 font-mono">
                          -
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          {formatCurrencyBRL(totalRev)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <p className="text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                    Esta receita de <strong>{formatCurrencyBRL(totalRev)}</strong> é creditada diretamente na apuração zootécnica de custo limpo, amortizando o preço por kg dos cortes nobres.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(viewingRecord)}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Editar Este Registro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="px-5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================== */}
      {/* 2. MODAL EDITAR COLETA DE DESCARTE         */}
      {/* ========================================== */}
      {editingRecord && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-900 dark:text-white transition-colors animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                  <Pencil className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Editar Coleta de Descarte
                  </h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Atualize os pesos, preços e dados da graxaria
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Data da Coleta</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Filial da Coleta</label>
                  <select
                    value={editStoreId}
                    onChange={(e) => setEditStoreId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Graxaria / Empresa Coletora</label>
                <input
                  type="text"
                  required
                  value={editRenderingPlant}
                  onChange={(e) => setEditRenderingPlant(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Carcaça Origem (kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={editCarcassWeight}
                    onChange={(e) => setEditCarcassWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso Sebo (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editFatWeight}
                    onChange={(e) => setEditFatWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso Osso (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editBoneWeight}
                    onChange={(e) => setEditBoneWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço Sebo (R$/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFatPrice}
                    onChange={(e) => setEditFatPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço Osso (R$/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editBonePrice}
                    onChange={(e) => setEditBonePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Real-time Summary preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Índice de Quebra / Descarte:</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">{editWastePercent.toFixed(1)}%</strong>
                  <span className="text-[10px] text-slate-500 block font-mono">({editTotalWasteWeight} kg total)</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Recuperado Atualizado:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatCurrencyBRL(editTotalFatRevenue + editTotalBoneRevenue)}
                  </strong>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    (Sebo: {formatCurrencyBRL(editTotalFatRevenue)} | Osso: {formatCurrencyBRL(editTotalBoneRevenue)})
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. MODAL CONFIRMAR EXCLUSÃO                */}
      {/* ========================================== */}
      {deletingRecord && (() => {
        const store = stores.find(s => s.id === deletingRecord.storeId);
        const totalVal = (deletingRecord.fatRevenueR$ || 0) + (deletingRecord.boneRevenueR$ || 0);

        return (
          <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-slate-900 dark:text-white transition-colors animate-scale-in">
              <div className="bg-rose-600 p-5 text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Confirmar Exclusão de Coleta
                  </h3>
                  <p className="text-xs text-rose-100">
                    Esta ação removerá o registro permanentemente
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
                <p>
                  Você tem certeza que deseja excluir o registro de coleta da filial <strong>{store?.name || deletingRecord.storeId}</strong>?
                </p>

                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 rounded-xl space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data da Coleta:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{deletingRecord.date}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Graxaria Destino:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{deletingRecord.renderingPlant}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sebo + Osso:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {(deletingRecord.fatWeightKg || 0) + (deletingRecord.boneWeightKg || 0)} kg ({deletingRecord.wastePercent}%)
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-rose-200 dark:border-rose-900 pt-1">
                    <span className="text-slate-500">Receita Recuperada:</span>
                    <strong className="text-rose-600 dark:text-rose-400">{formatCurrencyBRL(totalVal)}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Os valores consolidados de descarte e amortização no custo das carcaças serão recalculados imediatamente.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingRecord(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sim, Excluir Registro</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================== */}
      {/* 4. MODAL REGISTRAR NOVA COLETA             */}
      {/* ========================================== */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-900 dark:text-white transition-colors animate-scale-in">
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                  <Bone className="w-5 h-5 text-rose-100" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Registrar Coleta de Sebo e Osso
                  </h3>
                  <p className="text-xs text-rose-100 mt-0.5">
                    Pesagem e destinação para graxarias parceiras
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Data da Coleta</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Filial da Coleta</label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Graxaria / Coletora</label>
                <input
                  type="text"
                  required
                  value={renderingPlant}
                  onChange={(e) => setRenderingPlant(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Carcaça Desossada (kg)</label>
                  <input
                    type="number"
                    min="100"
                    value={carcassWeight}
                    onChange={(e) => setCarcassWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso do Sebo (kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={fatWeight}
                    onChange={(e) => setFatWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso do Osso (kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={boneWeight}
                    onChange={(e) => setBoneWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço do Sebo (R$/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fatPrice}
                    onChange={(e) => setFatPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço do Osso (R$/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bonePrice}
                    onChange={(e) => setBonePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Índice de Quebra / Descarte:</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">{wastePercent.toFixed(1)}%</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Receita Recuperada:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatCurrencyBRL(totalFatRevenue + totalBoneRevenue)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Pesagem de Descarte</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
