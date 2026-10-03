import React, { useState } from 'react';
import { WasteRecord, Store } from '../../types/erp';
import { formatCurrencyBRL } from '../../services/calculationService';
import { 
  Bone, 
  Trash2, 
  Plus, 
  Recycle, 
  Truck, 
  DollarSign, 
  Scale, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface WasteTabProps {
  wasteRecords: WasteRecord[];
  stores: Store[];
  onAddWasteRecord: (record: WasteRecord) => void;
}

export const WasteTab: React.FC<WasteTabProps> = ({ wasteRecords, stores, onAddWasteRecord }) => {
  const [showModal, setShowModal] = useState(false);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [carcassWeight, setCarcassWeight] = useState(1500);
  const [boneWeight, setBoneWeight] = useState(262.5); // ~17.5%
  const [fatWeight, setFatWeight] = useState(97.5);   // ~6.5%
  const [bonePrice, setBonePrice] = useState(0.70);
  const [fatPrice, setFatPrice] = useState(2.10);
  const [renderingPlant, setRenderingPlant] = useState('Graxaria Fluminense Ltda');

  const totalFatRevenue = fatWeight * fatPrice;
  const totalBoneRevenue = boneWeight * bonePrice;
  const totalWasteWeight = boneWeight + fatWeight;
  const wastePercent = carcassWeight > 0 ? (totalWasteWeight / carcassWeight) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: WasteRecord = {
      id: `wst-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      storeId,
      carcassOriginWeightKg: carcassWeight,
      fatWeightKg: fatWeight,
      boneWeightKg: boneWeight,
      fatSalePriceKg: fatPrice,
      boneSalePriceKg: bonePrice,
      fatRevenueR$: Number(totalFatRevenue.toFixed(2)),
      boneRevenueR$: Number(totalBoneRevenue.toFixed(2)),
      wastePercent: Number(wastePercent.toFixed(1)),
      renderingPlant
    };
    onAddWasteRecord(newRecord);
    setShowModal(false);
  };

  const consolidatedBoneWeight = wasteRecords.reduce((acc, r) => acc + r.boneWeightKg, 0);
  const consolidatedFatWeight = wasteRecords.reduce((acc, r) => acc + r.fatWeightKg, 0);
  const consolidatedRevenue = wasteRecords.reduce((acc, r) => acc + r.fatRevenueR$ + r.boneRevenueR$, 0);

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
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
              {wasteRecords.map((rec) => {
                const store = stores.find(s => s.id === rec.storeId);
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
                      {rec.carcassOriginWeightKg.toLocaleString('pt-BR')} kg
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
                      {formatCurrencyBRL(rec.fatRevenueR$)}
                    </td>

                    <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">
                      {formatCurrencyBRL(rec.boneRevenueR$)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyBRL(rec.fatRevenueR$ + rec.boneRevenueR$)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Coleta */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bone className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                <span>Registrar Coleta de Sebo e Osso</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Filial da Coleta</label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Graxaria / Coletora</label>
                <input
                  type="text"
                  required
                  value={renderingPlant}
                  onChange={(e) => setRenderingPlant(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso do Sebo (kg)</label>
                  <input
                    type="number"
                    min="10"
                    step="0.5"
                    value={fatWeight}
                    onChange={(e) => setFatWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Peso do Osso (kg)</label>
                  <input
                    type="number"
                    min="10"
                    step="0.5"
                    value={boneWeight}
                    onChange={(e) => setBoneWeight(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço do Sebo (R$/kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={fatPrice}
                    onChange={(e) => setFatPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Preço do Osso (R$/kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={bonePrice}
                    onChange={(e) => setBonePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
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

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Salvar Pesagem de Descarte
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
