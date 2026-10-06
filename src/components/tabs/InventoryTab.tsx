import React, { useState } from 'react';
import { SheetRowData, Store } from '../../types/erp';
import { 
  Boxes, 
  Warehouse, 
  Truck, 
  Layers, 
  ArrowRightLeft, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Plus,
  Building2,
  FileSpreadsheet,
  ClipboardList,
  Check,
  X
} from 'lucide-react';
import { formatNumberBR } from '../../services/calculationService';
import { StockLaunchByStore } from '../inventory/StockLaunchByStore';

interface InventoryTabProps {
  rows: SheetRowData[];
  stores: Store[];
  onUpdateRow: (row: SheetRowData) => void;
  onUpdateMultiple?: (rows: SheetRowData[]) => void;
  onNavigateToSheet?: () => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ 
  rows, 
  stores, 
  onUpdateRow, 
  onUpdateMultiple,
  onNavigateToSheet 
}) => {
  const [activeView, setActiveView] = useState<'launch' | 'overview'>('launch');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromStoreId, setFromStoreId] = useState(stores[0]?.id || '');
  const [toStoreId, setToStoreId] = useState(stores[1]?.id || '');
  const [transferCuts, setTransferCuts] = useState<'dianteiro' | 'traseiro' | 'coxao' | 'alcatrao'>('dianteiro');
  const [transferAmount, setTransferAmount] = useState(2);

  // Totais consolidados
  const totalChamberPieces = rows.reduce((acc, r) => 
    acc + r.camaraDianteiro + r.somaDoTraseiro + r.camaraCostelaGaucha, 0
  );
  const totalInTransit = rows.reduce((acc, r) => acc + r.pTransito, 0);
  const totalCounterPieces = rows.reduce((acc, r) => 
    acc + r.totalDianteiro + r.totalCoxao + r.totalAlcatrao + r.costelaCong, 0
  );

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExecuteTransfer = () => {
    if (fromStoreId === toStoreId) {
      alert('Selecione lojas de origem e destino diferentes.');
      return;
    }
    const sourceRow = rows.find(r => r.storeId === fromStoreId);
    const targetRow = rows.find(r => r.storeId === toStoreId);

    if (!sourceRow || !targetRow) return;

    let fieldKey: 'camaraDianteiro' | 'camaraTraseiro' | 'camaraCoxao' | 'camaraAlcatrao' = 'camaraDianteiro';
    if (transferCuts === 'dianteiro') fieldKey = 'camaraDianteiro';
    if (transferCuts === 'traseiro') fieldKey = 'camaraTraseiro';
    if (transferCuts === 'coxao') fieldKey = 'camaraCoxao';
    if (transferCuts === 'alcatrao') fieldKey = 'camaraAlcatrao';

    if (sourceRow[fieldKey] < transferAmount) {
      alert(`A loja de origem não possui ${transferAmount} peças de ${transferCuts} disponíveis na câmara.`);
      return;
    }

    const updatedSource = {
      ...sourceRow,
      [fieldKey]: sourceRow[fieldKey] - transferAmount
    };
    if (fieldKey !== 'camaraDianteiro') {
      updatedSource.somaDoTraseiro = updatedSource.camaraTraseiro + updatedSource.camaraCoxao + updatedSource.camaraAlcatrao;
    }

    const updatedTarget = {
      ...targetRow,
      [fieldKey]: targetRow[fieldKey] + transferAmount
    };
    if (fieldKey !== 'camaraDianteiro') {
      updatedTarget.somaDoTraseiro = updatedTarget.camaraTraseiro + updatedTarget.camaraCoxao + updatedTarget.camaraAlcatrao;
    }

    onUpdateRow(updatedSource);
    onUpdateRow(updatedTarget);
    setShowTransferModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Lançamento de Estoque por Filial & Câmaras Frias
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lançamentos sincronizados em tempo real com a Planilha de Compras Oficial v10.4
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subview Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setActiveView('launch')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
                activeView === 'launch'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Lançamento por Filial</span>
            </button>
            <button
              onClick={() => setActiveView('overview')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
                activeView === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Visão Geral Câmaras</span>
            </button>
          </div>

          <button
            onClick={() => setShowTransferModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transferência</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Estoque em Câmara */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Estoque em Câmara Fria
            </span>
            <Warehouse className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {totalChamberPieces.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">peças</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Peças inteiras e quartos pendurados nas 16 câmaras
          </div>
        </div>

        {/* Estoque em Balcão */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Balcão e Desossa
            </span>
            <Layers className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {totalCounterPieces.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">cortes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Cortes limpos, bandejas e peças em desossa ativa
          </div>
        </div>

        {/* Peças em Trânsito */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
              Em Trânsito / Cargas
            </span>
            <Truck className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {totalInTransit} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">peças</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Caminhões frigoríficos em rota de entrega para as lojas
          </div>
        </div>
      </div>

      {/* Main View Mode Body */}
      {activeView === 'launch' ? (
        <StockLaunchByStore
          rows={rows}
          stores={stores}
          onUpdateRow={onUpdateRow}
          onUpdateMultiple={onUpdateMultiple}
          onNavigateToSheet={onNavigateToSheet}
        />
      ) : (
        /* Store Chambers Inventory Table (Overview) */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Status Consolidado das Câmaras Frias por Filial
              </h3>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar loja ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500 w-56 transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Filial / Responsável</th>
                  <th className="px-3 py-3 text-center" title="Informação sincronizada do Portal de Membros: Confirmação se a filial recebeu boi hoje">
                    <span className="block">Recebeu Boi Hoje?</span>
                    <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400 block tracking-tight">Portal de Membros</span>
                  </th>
                  <th className="px-3 py-3 text-center">Dianteiro Câmara</th>
                  <th className="px-3 py-3 text-center">Traseiro Câmara</th>
                  <th className="px-3 py-3 text-center">Coxão Câmara</th>
                  <th className="px-3 py-3 text-center">Alcatrão Câmara</th>
                  <th className="px-3 py-3 text-center">Costela Gaúcha</th>
                  <th className="px-3 py-3 text-center">Total Peças Câmara</th>
                  <th className="px-3 py-3 text-center">Capacidade Máxima</th>
                  <th className="px-4 py-3 text-center">Ocupação da Câmara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-mono">
                {filteredStores.map((store) => {
                  const row = rows.find(r => r.storeId === store.id);
                  if (!row) return null;
                  const totalCamara = row.camaraDianteiro + row.camaraTraseiro + row.camaraCoxao + row.camaraAlcatrao + row.camaraCostelaGaucha;
                  const capacity = store.chamberCapacityPieces || 45;
                  const occupancyPercent = Math.min(100, Math.round((totalCamara / capacity) * 100));

                  let occupancyColor = 'bg-emerald-500';
                  if (occupancyPercent > 80) occupancyColor = 'bg-amber-500';
                  if (occupancyPercent > 95) occupancyColor = 'bg-red-500';

                  return (
                    <tr key={store.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 font-sans">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{store.name}</div>
                        <div className="text-[10px] text-slate-500">{store.city} • Resp: {store.manager}</div>
                      </td>

                      <td className="px-3 py-2.5 text-center font-sans">
                        {row.recebeuBoiHoje ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs" 
                            title="Portal de Membros: Confirmado que a loja recebeu boi hoje (SIM)"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                            <span>OK</span>
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-2xs" 
                            title="Portal de Membros: Loja NÃO recebeu boi hoje"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[3]" />
                            <span>X</span>
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold">
                        {row.camaraDianteiro}
                      </td>

                      <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300 font-bold">
                        {row.camaraTraseiro}
                      </td>

                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {row.camaraCoxao}
                      </td>

                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {row.camaraAlcatrao}
                      </td>

                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {row.camaraCostelaGaucha}
                      </td>

                      <td className="px-3 py-2.5 text-center text-amber-700 dark:text-amber-300 font-bold text-sm">
                        {totalCamara} pç
                      </td>

                      <td className="px-3 py-2.5 text-center text-slate-500 dark:text-slate-400">
                        {capacity} pç
                      </td>

                      <td className="px-4 py-2.5 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all ${occupancyColor}`} 
                              style={{ width: `${occupancyPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 w-8 text-right font-medium">
                            {occupancyPercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Transferência */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span>Transferência entre Lojas</span>
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Loja de Origem (Saída)</label>
                <select
                  value={fromStoreId}
                  onChange={(e) => setFromStoreId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Loja de Destino (Entrada)</label>
                <select
                  value={toStoreId}
                  onChange={(e) => setToStoreId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Tipo de Peça</label>
                  <select
                    value={transferCuts}
                    onChange={(e: any) => setTransferCuts(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-sans"
                  >
                    <option value="dianteiro">Dianteiro c/ Osso</option>
                    <option value="traseiro">Traseiro c/ Osso</option>
                    <option value="coxao">Coxão</option>
                    <option value="alcatrao">Alcatrão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Quantidade (Peças)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
