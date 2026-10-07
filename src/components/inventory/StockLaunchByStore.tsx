import React, { useState, useEffect } from 'react';
import { SheetRowData, Store } from '../../types/erp';
import { 
  recalculateRowOrderFormulas, 
  DEFAULT_CUT_YIELD_WEIGHTS,
  HALF_CARCASS_CUT_YIELD_WEIGHTS,
  CutYieldWeights,
  formatNumberBR
} from '../../services/calculationService';
import { StorageService } from '../../services/storageService';
import { 
  Building2, 
  Save, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Beef, 
  Scissors, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trash2,
  Eraser
} from 'lucide-react';
import { ClearAllStoresConfirmModal } from '../modals/ClearAllStoresConfirmModal';
import { INITIAL_SHEET_ROWS } from '../../data/initialData';

interface StockLaunchByStoreProps {
  rows: SheetRowData[];
  stores: Store[];
  onUpdateRow: (row: SheetRowData) => void;
  onUpdateMultiple?: (rows: SheetRowData[]) => void;
  onNavigateToSheet?: () => void;
}

export const StockLaunchByStore: React.FC<StockLaunchByStoreProps> = ({
  rows,
  stores,
  onUpdateRow,
  onUpdateMultiple,
  onNavigateToSheet
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '1');
  const [draftRow, setDraftRow] = useState<SheetRowData | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Armazena e persiste quais filiais já tiveram estoque lançado
  const [launchedStoreIds, setLaunchedStoreIds] = useState<Set<string>>(() => {
    try {
      const records = StorageService.getStockLaunchRecords();
      const idsFromRecords = records.map(r => r.storeId);
      const saved = localStorage.getItem('gapp_stock_launched_stores');
      const idsFromSaved = saved ? JSON.parse(saved) : [];
      return new Set<string>([...idsFromRecords, ...idsFromSaved]);
    } catch {
      return new Set<string>();
    }
  });

  // Ouve eventos de limpeza disparados pelo sistema ou pela Planilha de Compras
  useEffect(() => {
    const handleLaunchesCleared = () => {
      setLaunchedStoreIds(new Set<string>());
    };
    window.addEventListener('gapp_stock_launches_cleared', handleLaunchesCleared);
    return () => {
      window.removeEventListener('gapp_stock_launches_cleared', handleLaunchesCleared);
    };
  }, []);

  const yieldParams = StorageService.getYieldParams();
  const currentWeights: CutYieldWeights = yieldParams.basis === 'piece' 
    ? HALF_CARCASS_CUT_YIELD_WEIGHTS 
    : DEFAULT_CUT_YIELD_WEIGHTS;

  // Verifica de forma robusta se a filial possui dados de estoque lançados na planilha
  const isStoreLaunched = (storeId: string): boolean => {
    if (launchedStoreIds.has(storeId)) return true;
    
    try {
      const records = StorageService.getStockLaunchRecords();
      if (records.some(r => r.storeId === storeId)) return true;
    } catch {}

    const row = rows.find(r => r.storeId === storeId);
    if (row) {
      const chamberPieces = (row.camaraDianteiro || 0) + (row.camaraTraseiro || 0) + (row.camaraCoxao || 0) + (row.camaraAlcatrao || 0) + (row.camaraCostelaGaucha || 0);
      const counterPieces = (row.alcatra || 0) + (row.contraFile || 0) + (row.picanha || 0) + (row.fileMignon || 0) + (row.costelaCong || 0) +
                            (row.paletaPecas || 0) + (row.acemPecas || 0) + (row.peitoPecas || 0) + (row.musculoPecas || 0) +
                            (row.chaPecas || 0) + (row.patinhoPecas || 0) + (row.lagartoRedondoPecas || 0) + (row.lagartoPlanoPecas || 0) +
                            (row.bandaPecas || 0) + (row.costelaSuinaPecas || 0) + (row.pernilPecas || 0);
      if (chamberPieces + counterPieces > 0) return true;
    }
    return false;
  };

  // Carrega a linha da loja selecionada
  useEffect(() => {
    const row = rows.find(r => r.storeId === selectedStoreId);
    if (row) {
      const recalculated = recalculateRowOrderFormulas({ ...row }, currentWeights);
      setDraftRow(prev => {
        if (prev && prev.storeId === selectedStoreId && JSON.stringify(prev) === JSON.stringify(recalculated)) {
          return prev;
        }
        return recalculated;
      });
    }
  }, [selectedStoreId, rows]);

  const selectedStore = stores.find(s => s.id === selectedStoreId);
  const currentStoreIndex = stores.findIndex(s => s.id === selectedStoreId);

  const handleFieldChange = (field: keyof SheetRowData, value: number) => {
    if (!draftRow) return;
    const val = Math.max(0, isNaN(value) ? 0 : value);
    const updated = recalculateRowOrderFormulas({
      ...draftRow,
      [field]: val
    }, currentWeights);
    setDraftRow(updated);
  };

  const handleSave = () => {
    if (!draftRow || !selectedStore) return;
    const finalRow = recalculateRowOrderFormulas(draftRow, currentWeights);
    
    // 1. Atualiza e mantém na Planilha de Compras Oficial
    onUpdateRow(finalRow);

    // 2. Marca a aba da filial como lançada (cor verde)
    setLaunchedStoreIds(prev => {
      const next = new Set(prev);
      next.add(selectedStore.id);
      try {
        localStorage.setItem('gapp_stock_launched_stores', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    // 3. Registra data, hora e métricas no histórico persistente
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const totalPecas = finalRow.camaraDianteiro + finalRow.somaDoTraseiro + finalRow.camaraCostelaGaucha +
                       finalRow.alcatra + finalRow.contraFile + finalRow.picanha + finalRow.fileMignon + finalRow.costelaCong +
                       finalRow.paletaPecas + finalRow.acemPecas + finalRow.peitoPecas + finalRow.musculoPecas +
                       finalRow.chaPecas + finalRow.patinhoPecas + finalRow.lagartoRedondoPecas + finalRow.lagartoPlanoPecas +
                       finalRow.bandaPecas + finalRow.costelaSuinaPecas + finalRow.pernilPecas;

    const totalKg = (finalRow.alcatraKg || 0) + (finalRow.contraFileKg || 0) + (finalRow.picanhaKg || 0) + (finalRow.fileMignonKg || 0) +
                    (finalRow.paletaKg || 0) + (finalRow.acemKg || 0) + (finalRow.peitoKg || 0) + (finalRow.musculoKg || 0) +
                    (finalRow.chaKg || 0) + (finalRow.patinhoKg || 0) + (finalRow.lagartoRedondoKg || 0) + (finalRow.lagartoPlanoKg || 0) +
                    (finalRow.bandaKg || 0) + (finalRow.camaraDianteiro * 60) + (finalRow.camaraTraseiro * 60);

    const launchRecord = {
      id: `launch-inv-${Date.now()}`,
      date: formattedDate,
      timestamp: now.getTime(),
      storeId: selectedStore.id,
      storeName: selectedStore.name,
      operatorName: selectedStore.manager ? `Gerente ${selectedStore.manager}` : 'Conferente de Estoque',
      totalPieces: totalPecas,
      totalKg: Math.round(totalKg),
      boisEquivalente: finalRow.boi || 0,
      sugestaoPedido: finalRow.sugestaoPedido || 0,
      rowData: finalRow,
      recebeuBoiHoje: finalRow.recebeuBoiHoje ?? false,
      notes: `Lançamento manual registrado na aba Estoque & Câmaras (${selectedStore.name})`
    };

    StorageService.addStockLaunchRecord(launchRecord);

    // 3. Atualiza também snapshot no histórico de versões da planilha com data gravada para localização
    const currentAllRows = rows.map(r => r.storeId === finalRow.storeId ? finalRow : r);
    const sheetSnapshot = StorageService.createSnapshotFromRows(
      currentAllRows,
      `Estoque Gravado: ${selectedStore.name}`,
      selectedStore.manager || 'Conferente Estoque',
      'INVENTORY_TAB',
      `Lançamento de estoque e câmara da filial ${selectedStore.name} gravado e mantido na planilha.`
    );
    StorageService.addSheetSnapshot(sheetSnapshot);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetStore = () => {
    if (!draftRow || !selectedStore) return;
    if (window.confirm(`Deseja zerar os lançamentos de estoque da loja ${selectedStore.name}?`)) {
      const cleared = recalculateRowOrderFormulas({
        ...draftRow,
        camaraDianteiro: 0,
        camaraTraseiro: 0,
        camaraCoxao: 0,
        camaraAlcatrao: 0,
        camaraCostelaGaucha: 0,
        alcatra: 0,
        alcatraPecas: 0,
        alcatraKg: 0,
        contraFile: 0,
        contraFilePecas: 0,
        contraFileKg: 0,
        picanha: 0,
        picanhaPecas: 0,
        picanhaKg: 0,
        fileMignon: 0,
        fileMignonPecas: 0,
        fileMignonKg: 0,
        costelaCong: 0,
        paletaKg: 0,
        paletaPecas: 0,
        acemKg: 0,
        acemPecas: 0,
        peitoKg: 0,
        peitoPecas: 0,
        musculoKg: 0,
        musculoPecas: 0,
        chaKg: 0,
        chaPecas: 0,
        patinhoKg: 0,
        patinhoPecas: 0,
        lagartoRedondoKg: 0,
        lagartoRedondoPecas: 0,
        lagartoPlanoKg: 0,
        lagartoPlanoPecas: 0,
        bandaKg: 0,
        bandaPecas: 0,
        costelaSuinaPecas: 0,
        pernilPecas: 0,
        pTransito: 0
      }, currentWeights);
      setDraftRow(cleared);
      onUpdateRow(cleared);
      setLaunchedStoreIds(prev => {
        const next = new Set(prev);
        next.delete(selectedStore.id);
        try {
          localStorage.setItem('gapp_stock_launched_stores', JSON.stringify(Array.from(next)));
        } catch (e) {
          console.warn(e);
        }
        return next;
      });
    }
  };

  // Limpa os dados de lançamento de TODAS as lojas e reseta as abas para a cor do sistema
  const handleClearAllStores = (resetOption: 'all_zero' | 'restore_initial') => {
    // 1. Limpa registros e marcas de filiais lançadas
    StorageService.clearAllStockLaunchRecords();
    setLaunchedStoreIds(new Set<string>());

    let updatedRows: SheetRowData[] = [];

    if (resetOption === 'restore_initial') {
      // Restaura dados de referência inicial da matriz
      updatedRows = INITIAL_SHEET_ROWS.map(r => recalculateRowOrderFormulas(r, currentWeights));
    } else {
      // Zera estoque e pedidos de todas as lojas para iniciar novo ciclo limpo
      updatedRows = rows.map(r => {
        const emptyRow: SheetRowData = {
          ...r,
          // PEDIDOS
          pedidoDianteiro: 0,
          pedidoTraseiro: 0,
          pedidoCoxao: 0,
          pedidoAlcatrao: 0,
          pedidoCostelaGaucha: 0,
          venda: 0,
          boiAVenda: 0,
          pedidoFinal: 0,
          pTransito: 0,

          // CÂMARA FRIA
          camaraDianteiro: 0,
          camaraTraseiro: 0,
          camaraCoxao: 0,
          camaraAlcatrao: 0,
          somaDoTraseiro: 0,
          camaraCostelaGaucha: 0,

          // NOBRES
          alcatra: 0,
          alcatraPecas: 0,
          alcatraKg: 0,
          contraFile: 0,
          contraFilePecas: 0,
          contraFileKg: 0,
          picanha: 0,
          picanhaPecas: 0,
          picanhaKg: 0,
          fileMignon: 0,
          fileMignonPecas: 0,
          fileMignonKg: 0,
          costelaCong: 0,
          totalAlcatrao: 0,

          // DIANTEIRO
          totalDianteiro: 0,
          paletaKg: 0,
          paletaPecas: 0,
          acemKg: 0,
          acemPecas: 0,
          peitoKg: 0,
          peitoPecas: 0,
          musculoKg: 0,
          musculoPecas: 0,

          // COXÃO / TRASEIRO
          totalCoxao: 0,
          chaKg: 0,
          chaPecas: 0,
          patinhoKg: 0,
          patinhoPecas: 0,
          lagartoRedondoKg: 0,
          lagartoRedondoPecas: 0,
          lagartoPlanoKg: 0,
          lagartoPlanoPecas: 0,

          // SUÍNO / BANDA
          bandaKg: 0,
          bandaPecas: 0,
          bandaVenda: 0,
          vendaSuino: 0,
          bandaSugestao: 0,
          bandaPedido: 0,
          pedidoSuino: 0,
          costelaSuinaPecas: 0,
          pernilPecas: 0,
          recebeuBoiHoje: undefined
        };
        return recalculateRowOrderFormulas(emptyRow, currentWeights);
      });
    }

    // 2. Atualiza matriz no estado pai e no localStorage/banco de dados
    if (onUpdateMultiple) {
      onUpdateMultiple(updatedRows);
    } else {
      updatedRows.forEach(r => onUpdateRow(r));
    }
    StorageService.saveSheetRows(updatedRows);

    // 3. Atualiza o rascunho da loja atualmente em visualização
    const currentDraft = updatedRows.find(r => r.storeId === selectedStoreId);
    if (currentDraft) {
      setDraftRow(currentDraft);
    }

    // 4. Salva registro de ciclo zerado no histórico para auditoria
    const clearSnapshot = StorageService.createSnapshotFromRows(
      updatedRows,
      'Novo Ciclo: Lojas Zeradas',
      'Direção / Gerência',
      'INVENTORY_TAB',
      `Informações de todas as ${stores.length} lojas limpas com sucesso para início de novo ciclo de lançamentos.`
    );
    StorageService.addSheetSnapshot(clearSnapshot);
  };

  const handlePrevStore = () => {
    if (currentStoreIndex > 0) {
      if (draftRow) onUpdateRow(draftRow);
      setSelectedStoreId(stores[currentStoreIndex - 1].id);
    }
  };

  const handleNextStore = () => {
    if (currentStoreIndex < stores.length - 1) {
      if (draftRow) onUpdateRow(draftRow);
      setSelectedStoreId(stores[currentStoreIndex + 1].id);
    }
  };

  if (!draftRow || !selectedStore) return null;

  return (
    <div className="space-y-6">
      {/* Top Store Selector Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Lançamento de Estoque: <span className="text-amber-600 dark:text-amber-400">{selectedStore.name}</span>
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  {currentStoreIndex + 1} de {stores.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedStore.city} • Gerente: {selectedStore.manager} • Capacidade Câmara: {selectedStore.chamberCapacityPieces} peças
              </p>
            </div>
          </div>

          {/* Store Selection & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Informação do Portal de Membros: Recebeu Boi Hoje? */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mr-0.5">
                Recebeu Boi?
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!draftRow) return;
                  const updated = { ...draftRow, recebeuBoiHoje: true };
                  setDraftRow(updated);
                  onUpdateRow(updated);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  draftRow.recebeuBoiHoje === true
                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
                }`}
                title="Marcar: Loja recebeu boi hoje (OK)"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>OK (Sim)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!draftRow) return;
                  const updated = { ...draftRow, recebeuBoiHoje: false };
                  setDraftRow(updated);
                  onUpdateRow(updated);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  draftRow.recebeuBoiHoje === false
                    ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700'
                }`}
                title="Marcar: Loja NÃO recebeu boi hoje (X)"
              >
                <X className="w-3 h-3 stroke-[3]" />
                <span>X (Não)</span>
              </button>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={handlePrevStore}
                disabled={currentStoreIndex === 0}
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300"
                title="Loja Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedStoreId}
                onChange={(e) => {
                  if (draftRow) onUpdateRow(draftRow);
                  setSelectedStoreId(e.target.value);
                }}
                className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none cursor-pointer"
              >
                {stores.map((s, idx) => {
                  const launched = isStoreLaunched(s.id);
                  return (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {launched ? '✓ ' : ''}{idx + 1}. {s.name} ({s.city})
                    </option>
                  );
                })}
              </select>

              <button
                onClick={handleNextStore}
                disabled={currentStoreIndex === stores.length - 1}
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300"
                title="Próxima Loja"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSave}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
                saveSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvo na Planilha!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Lançamento</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
              title="Limpar informações de lançamento de todas as lojas para iniciar novo ciclo semanal"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Limpar Todas as Lojas</span>
            </button>

            <button
              onClick={handleResetStore}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
              title="Zerar dados de estoque apenas desta loja selecionada"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onNavigateToSheet && (
              <button
                onClick={onNavigateToSheet}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver na Planilha de Compras</span>
              </button>
            )}
          </div>
        </div>

        {/* Store pills quick bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
          {stores.map((s, idx) => {
            const isCurr = s.id === selectedStoreId;
            const isLaunched = isStoreLaunched(s.id);
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (draftRow) onUpdateRow(draftRow);
                  setSelectedStoreId(s.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                  isCurr
                    ? `bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md ring-2 ${isLaunched ? 'ring-emerald-500 dark:ring-emerald-400' : 'ring-white/90 dark:ring-amber-300'}`
                    : isLaunched
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/60 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-medium'
                }`}
                title={isLaunched ? `✓ Lançamento de dados realizado: ${s.name} (Dados da filial já lançados na planilha)` : `Pendente de lançamento: ${s.name}`}
              >
                {isLaunched && (
                  <Check className={`w-3.5 h-3.5 stroke-[3] shrink-0 ${isCurr ? 'text-slate-950' : 'text-emerald-600 dark:text-emerald-300'}`} />
                )}
                <span>{idx + 1}. {s.name.replace('Loja ', 'L.')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Impact Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
            Dianteiro Total
          </span>
          <span className="text-xl font-bold font-mono text-blue-900 dark:text-blue-100">
            {draftRow.pedidoDianteiro} <span className="text-xs font-normal">pç</span>
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 block">
            Câm ({draftRow.camaraDianteiro}) + Des ({draftRow.totalDianteiro})
          </span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">
            Coxão Total
          </span>
          <span className="text-xl font-bold font-mono text-rose-900 dark:text-rose-100">
            {draftRow.pedidoCoxao} <span className="text-xs font-normal">pç</span>
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block">
            Câm ({draftRow.camaraCoxao}) + Des ({draftRow.totalCoxao})
          </span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
            Alcatrão Total
          </span>
          <span className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-100">
            {draftRow.pedidoAlcatrao} <span className="text-xs font-normal">pç</span>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
            Câm ({draftRow.camaraAlcatrao}) + Des ({draftRow.totalAlcatrao})
          </span>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
            Soma Traseiro Câm.
          </span>
          <span className="text-xl font-bold font-mono text-purple-900 dark:text-purple-100">
            {draftRow.somaDoTraseiro} <span className="text-xs font-normal">pç</span>
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 block">
            Tr ({draftRow.camaraTraseiro}) + Cx ({draftRow.camaraCoxao}) + Alc ({draftRow.camaraAlcatrao})
          </span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">
            Boi Equivalente
          </span>
          <span className="text-xl font-bold font-mono text-amber-900 dark:text-amber-100">
            {draftRow.boi} <span className="text-xs font-normal">bois</span>
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
            (Diant + Tras + Cox + Alc) / 2
          </span>
        </div>

        <div className={`border rounded-xl p-3 ${
          draftRow.sugestaoPedido > 0 
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-100'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-100'
        }`}>
          <span className="text-[10px] uppercase font-bold block">
            Sugestão Pedido
          </span>
          <span className="text-xl font-bold font-mono">
            {draftRow.sugestaoPedido} <span className="text-xs font-normal">bois</span>
          </span>
          <span className="text-[10px] block opacity-80">
            Venda ({draftRow.venda || draftRow.boiAVenda}) - Boi ({draftRow.boi})
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CABEÇALHO: CARNE BOVINA (PEÇA INTEIRA CÂMARA) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-5 py-3.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Beef className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                1. CARNE BOVINA — PEÇA INTEIRA CÂMARA
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vinculado diretamente à seção <strong className="text-amber-700 dark:text-amber-300">"PEÇA INTEIRA CÂMARA"</strong> da Planilha de Compras
              </p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            Total Câmara: {draftRow.camaraDianteiro + draftRow.somaDoTraseiro + draftRow.camaraCostelaGaucha} pç
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Dianteiro Câmara */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Dianteiro Câmara
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.camaraDianteiro === 0 ? '' : draftRow.camaraDianteiro}
                onChange={(e) => handleFieldChange('camaraDianteiro', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Col. Planilha: Dianteiro</span>
          </div>

          {/* Traseiro Câmara */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Traseiro Câmara
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.camaraTraseiro === 0 ? '' : draftRow.camaraTraseiro}
                onChange={(e) => handleFieldChange('camaraTraseiro', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Col. Planilha: Traseiro</span>
          </div>

          {/* Coxão Câmara */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Coxão Câmara
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.camaraCoxao === 0 ? '' : draftRow.camaraCoxao}
                onChange={(e) => handleFieldChange('camaraCoxao', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Col. Planilha: Coxão</span>
          </div>

          {/* Alcatrão Câmara */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alcatrão Câmara
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.camaraAlcatrao === 0 ? '' : draftRow.camaraAlcatrao}
                onChange={(e) => handleFieldChange('camaraAlcatrao', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Col. Planilha: Alcatrão</span>
          </div>

          {/* Costela Gaúcha Câmara */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Costela Gaúcha
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.camaraCostelaGaucha === 0 ? '' : draftRow.camaraCostelaGaucha}
                onChange={(e) => handleFieldChange('camaraCostelaGaucha', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Col. Planilha: Costela G.</span>
          </div>

          {/* Peça em Trânsito */}
          <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
            <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
              Peça em Trânsito
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.pTransito === 0 ? '' : draftRow.pTransito}
                onChange={(e) => handleFieldChange('pTransito', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg p-2 text-sm font-mono font-bold text-blue-900 dark:text-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-xs text-blue-500 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-1">Caminhões em rota</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CABEÇALHO: CARNE BOVINA DESOSSA BALCÃO */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-5 py-3.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Scissors className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                2. CARNE BOVINA DESOSSA BALCÃO
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vinculado a <strong className="text-emerald-700 dark:text-emerald-300">"BALCÃO / CÂMARA / DESOSSA"</strong> (Nobres), <strong className="text-purple-700 dark:text-purple-300">"BALCÃO DE DESOSSA (DIANTEIRO)"</strong> e <strong className="text-rose-700 dark:text-rose-300">"BALCÃO DE DESOSSA (TRASEIRO)"</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* 2.1 NOBRES / ALCATRÃO */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                  Cortes Nobres & Alcatrão (Fator divisor: 22)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Tot. Alcatrão Calculado: {draftRow.totalAlcatrao} pç
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Alcatra */}
              <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Alcatra
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.alcatra === 0 ? '' : draftRow.alcatra}
                    onChange={(e) => handleFieldChange('alcatra', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2 text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex justify-between">
                  <span>Peso ({currentWeights.alcatra}kg):</span>
                  <strong>{draftRow.alcatraKg} kg</strong>
                </div>
              </div>

              {/* Contra Filé */}
              <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Contra Filé
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.contraFile === 0 ? '' : draftRow.contraFile}
                    onChange={(e) => handleFieldChange('contraFile', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2 text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex justify-between">
                  <span>Peso ({currentWeights.contraFile}kg):</span>
                  <strong>{draftRow.contraFileKg} kg</strong>
                </div>
              </div>

              {/* Picanha */}
              <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Picanha
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.picanha === 0 ? '' : draftRow.picanha}
                    onChange={(e) => handleFieldChange('picanha', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2 text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex justify-between">
                  <span>Peso ({currentWeights.picanha}kg):</span>
                  <strong>{draftRow.picanhaKg} kg</strong>
                </div>
              </div>

              {/* Filé Mignon */}
              <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Filé Mignon
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.fileMignon === 0 ? '' : draftRow.fileMignon}
                    onChange={(e) => handleFieldChange('fileMignon', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2 text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex justify-between">
                  <span>Peso ({currentWeights.fileMignon}kg):</span>
                  <strong>{draftRow.fileMignonKg} kg</strong>
                </div>
              </div>

              {/* Costela Congelada */}
              <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Costela Congelada
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.costelaCong === 0 ? '' : draftRow.costelaCong}
                    onChange={(e) => handleFieldChange('costelaCong', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg p-2 text-sm font-mono font-bold text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">pç</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-1">Estoque Congelado</span>
              </div>
            </div>
          </div>

          {/* 2.2 DIANTEIRO BALCÃO */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-100 dark:border-purple-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-xs font-bold uppercase text-purple-800 dark:text-purple-300 tracking-wider">
                  Dianteiro Balcão de Desossa (Fator divisor: 35)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                Tot. Dianteiro Calculado: {draftRow.totalDianteiro} pç
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Paleta */}
              <div className="p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Paleta
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.paletaPecas === 0 ? '' : draftRow.paletaPecas}
                    onChange={(e) => handleFieldChange('paletaPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg p-2 text-sm font-mono font-bold text-purple-900 dark:text-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-purple-700 dark:text-purple-300 flex justify-between">
                  <span>Peso ({currentWeights.paleta}kg):</span>
                  <strong>{draftRow.paletaKg} kg</strong>
                </div>
              </div>

              {/* Acém */}
              <div className="p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Acém
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.acemPecas === 0 ? '' : draftRow.acemPecas}
                    onChange={(e) => handleFieldChange('acemPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg p-2 text-sm font-mono font-bold text-purple-900 dark:text-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-purple-700 dark:text-purple-300 flex justify-between">
                  <span>Peso ({currentWeights.acem}kg):</span>
                  <strong>{draftRow.acemKg} kg</strong>
                </div>
              </div>

              {/* Peito */}
              <div className="p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Peito
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.peitoPecas === 0 ? '' : draftRow.peitoPecas}
                    onChange={(e) => handleFieldChange('peitoPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg p-2 text-sm font-mono font-bold text-purple-900 dark:text-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-purple-700 dark:text-purple-300 flex justify-between">
                  <span>Peso ({currentWeights.peito}kg):</span>
                  <strong>{draftRow.peitoKg} kg</strong>
                </div>
              </div>

              {/* Músculo */}
              <div className="p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Músculo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.musculoPecas === 0 ? '' : draftRow.musculoPecas}
                    onChange={(e) => handleFieldChange('musculoPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg p-2 text-sm font-mono font-bold text-purple-900 dark:text-purple-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-purple-700 dark:text-purple-300 flex justify-between">
                  <span>Peso ({currentWeights.musculo}kg):</span>
                  <strong>{draftRow.musculoKg} kg</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 2.3 TRASEIRO / COXÃO BALCÃO */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-xs font-bold uppercase text-rose-800 dark:text-rose-300 tracking-wider">
                  Traseiro & Coxão Balcão de Desossa (Fator divisor: 35)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                Tot. Coxão Calculado: {draftRow.totalCoxao} pç
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Chã */}
              <div className="p-3 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-200 mb-1">
                  Chã (Coxão Mole)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.chaPecas === 0 ? '' : draftRow.chaPecas}
                    onChange={(e) => handleFieldChange('chaPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg p-2 text-sm font-mono font-bold text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-rose-700 dark:text-rose-300 flex justify-between">
                  <span>Peso ({currentWeights.cha}kg):</span>
                  <strong>{draftRow.chaKg} kg</strong>
                </div>
              </div>

              {/* Patinho */}
              <div className="p-3 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-200 mb-1">
                  Patinho
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.patinhoPecas === 0 ? '' : draftRow.patinhoPecas}
                    onChange={(e) => handleFieldChange('patinhoPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg p-2 text-sm font-mono font-bold text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-rose-700 dark:text-rose-300 flex justify-between">
                  <span>Peso ({currentWeights.patinho}kg):</span>
                  <strong>{draftRow.patinhoKg} kg</strong>
                </div>
              </div>

              {/* Lagarto Redondo */}
              <div className="p-3 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-200 mb-1">
                  Lagarto Redondo (Paulista)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.lagartoRedondoPecas === 0 ? '' : draftRow.lagartoRedondoPecas}
                    onChange={(e) => handleFieldChange('lagartoRedondoPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg p-2 text-sm font-mono font-bold text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-rose-700 dark:text-rose-300 flex justify-between">
                  <span>Peso ({currentWeights.lagartoRedondo}kg):</span>
                  <strong>{draftRow.lagartoRedondoKg} kg</strong>
                </div>
              </div>

              {/* Lagarto Plano */}
              <div className="p-3 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-200 mb-1">
                  Lagarto Plano (Tatu)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={draftRow.lagartoPlanoPecas === 0 ? '' : draftRow.lagartoPlanoPecas}
                    onChange={(e) => handleFieldChange('lagartoPlanoPecas', Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg p-2 text-sm font-mono font-bold text-rose-900 dark:text-rose-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-mono">pç</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-rose-700 dark:text-rose-300 flex justify-between">
                  <span>Peso ({currentWeights.lagartoPlano}kg):</span>
                  <strong>{draftRow.lagartoPlanoKg} kg</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CABEÇALHO: CARNE SUÍNA DESOSSA BALCÃO */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="px-5 py-3.5 bg-teal-500/10 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. CARNE SUÍNA DESOSSA BALCÃO
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Vinculado diretamente à seção <strong className="text-teal-700 dark:text-teal-300">"CÂMARA / BALCÃO E DESOSSA"</strong> (Suíno / Banda) da Planilha de Compras
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30">
            Sugestão Suíno: {draftRow.bandaSugestao} pç
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Banda Peças */}
          <div className="p-3 rounded-lg bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
            <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 mb-1">
              Banda Suína (Peças)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.bandaPecas === 0 ? '' : draftRow.bandaPecas}
                onChange={(e) => handleFieldChange('bandaPecas', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-lg p-2 text-sm font-mono font-bold text-teal-900 dark:text-teal-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <span className="text-xs text-teal-600 dark:text-teal-400 font-mono">pç</span>
            </div>
            <div className="mt-1 text-[11px] font-mono text-teal-700 dark:text-teal-300 flex justify-between">
              <span>Peso (36kg/pç):</span>
              <strong>{draftRow.bandaKg} kg</strong>
            </div>
          </div>

          {/* Costela Suína */}
          <div className="p-3 rounded-lg bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
            <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 mb-1">
              Costela Suína
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.costelaSuinaPecas === 0 ? '' : draftRow.costelaSuinaPecas}
                onChange={(e) => handleFieldChange('costelaSuinaPecas', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-lg p-2 text-sm font-mono font-bold text-teal-900 dark:text-teal-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <span className="text-xs text-teal-600 dark:text-teal-400 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-teal-700 dark:text-teal-400 block mt-1">Cortes no balcão</span>
          </div>

          {/* Pernil */}
          <div className="p-3 rounded-lg bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40">
            <label className="block text-xs font-bold text-teal-900 dark:text-teal-200 mb-1">
              Pernil Suíno
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={draftRow.pernilPecas === 0 ? '' : draftRow.pernilPecas}
                onChange={(e) => handleFieldChange('pernilPecas', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-lg p-2 text-sm font-mono font-bold text-teal-900 dark:text-teal-200 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <span className="text-xs text-teal-600 dark:text-teal-400 font-mono">pç</span>
            </div>
            <span className="text-[10px] text-teal-700 dark:text-teal-400 block mt-1">Cortes no balcão</span>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Limpar Informações de Todas as Lojas */}
      <ClearAllStoresConfirmModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleClearAllStores}
        stores={stores}
        launchedCount={launchedStoreIds.size}
      />
    </div>
  );
};
