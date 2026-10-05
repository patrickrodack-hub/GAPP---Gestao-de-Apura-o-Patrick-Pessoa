import React, { useState } from 'react';
import { SheetSnapshotRecord, SheetRowData } from '../../types/erp';
import { formatCurrencyBRL } from '../../services/calculationService';
import { 
  History, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Eye, 
  RotateCcw, 
  Trash2, 
  X, 
  Download, 
  FileSpreadsheet, 
  Beef, 
  ChevronRight, 
  Layers, 
  ArrowLeft,
  Smartphone,
  Sparkles,
  Info
} from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface SheetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: SheetSnapshotRecord[];
  onRestoreSnapshot: (snapshot: SheetSnapshotRecord) => void;
  onDeleteSnapshot: (id: string) => void;
}

export const SheetHistoryModal: React.FC<SheetHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRestoreSnapshot,
  onDeleteSnapshot
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [specificDateSearch, setSpecificDateSearch] = useState('');
  const [inspectingSnapshot, setInspectingSnapshot] = useState<SheetSnapshotRecord | null>(null);

  if (!isOpen) return null;

  const now = Date.now();
  const oneDayMs = 86400000;

  const filteredSnapshots = snapshots.filter((snap) => {
    // 1. Text Search (name, author, notes, date)
    const matchesText = 
      snap.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snap.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snap.date.includes(searchTerm) ||
      (snap.notes && snap.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Specific Date Search (DD/MM/AAAA)
    const matchesSpecificDate = specificDateSearch.trim() === '' || snap.date.includes(specificDateSearch.trim());

    // 3. Quick Date Range Filter
    let matchesRange = true;
    if (selectedDateFilter === 'TODAY') {
      matchesRange = (now - snap.timestamp) <= oneDayMs;
    } else if (selectedDateFilter === '7DAYS') {
      matchesRange = (now - snap.timestamp) <= (7 * oneDayMs);
    } else if (selectedDateFilter === '30DAYS') {
      matchesRange = (now - snap.timestamp) <= (30 * oneDayMs);
    }

    return matchesText && matchesSpecificDate && matchesRange;
  });

  const getSourceBadge = (source: SheetSnapshotRecord['source']) => {
    switch (source) {
      case 'PORTAL_MOBILE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Smartphone className="w-3 h-3" /> Portal Mobile
          </span>
        );
      case 'INVENTORY_TAB':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
            <Building2 className="w-3 h-3" /> Estoque & Câmaras
          </span>
        );
      case 'MANUAL_SHEET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <FileSpreadsheet className="w-3 h-3" /> Direção / Planilha
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
            <Sparkles className="w-3 h-3" /> Backup Automático
          </span>
        );
    }
  };

  const handleExportSnapshotCSV = (snap: SheetSnapshotRecord) => {
    StorageService.exportSheetToCSV(snap.rows);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden transition-colors">
        
        {/* Top Header */}
        <header className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            {inspectingSnapshot ? (
              <button
                onClick={() => setInspectingSnapshot(null)}
                className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-xs font-semibold"
                title="Voltar para a Lista de Versões"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <History className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {inspectingSnapshot ? `Visualizando Planilha: ${inspectingSnapshot.name}` : 'Histórico de Gravações da Planilha de Compras'}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {snapshots.length} {snapshots.length === 1 ? 'Versão Gravada' : 'Versões Gravadas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {inspectingSnapshot 
                  ? `Data de gravação: ${inspectingSnapshot.date} • Gravado por ${inspectingSnapshot.author}`
                  : 'Consulte, visualize ou restaure versões salvas da matriz com data e hora exatas'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* VIEW 1: PREVIEW / INSPEÇÃO DETALHADA DA PLANILHA SALVA */}
        {inspectingSnapshot ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Action Bar for inspected snapshot */}
            <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {inspectingSnapshot.date}
                </span>
                {getSourceBadge(inspectingSnapshot.source)}
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Total: <strong className="text-slate-900 dark:text-white">{inspectingSnapshot.totalPieces} peças</strong> ({inspectingSnapshot.totalBois} bois)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportSnapshotCSV(inspectingSnapshot)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar CSV</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Deseja restaurar a planilha gravada em ${inspectingSnapshot.date} para a Planilha Ativa de Compras?`)) {
                      onRestoreSnapshot(inspectingSnapshot);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar esta Planilha</span>
                </button>
              </div>
            </div>

            {/* Matrix Table Preview (Read-only accurate representation) */}
            <div className="flex-1 overflow-auto p-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10">
                    <tr>
                      <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Filial</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/40">Ped. Diant.</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/40">Ped. Tras.</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/40">Ped. Coxão</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/40">Ped. Alcat.</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-100/60 dark:bg-blue-900/40 font-extrabold text-blue-900 dark:text-blue-200">Boi Total</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/40">Venda</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/40">Sugestão</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Câm. Diant.</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Soma Tras.</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Alcatra (Pç)</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Contra Filé (Pç)</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Paleta (Pç)</th>
                      <th className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800">Chã (Pç)</th>
                      <th className="px-2 py-2 text-center">Banda Suíno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {inspectingSnapshot.rows.map((r, idx) => (
                      <tr key={r.storeId} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-950/40'}>
                        <td className="px-3 py-2 font-sans font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          {r.storeName}
                        </td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-300 font-bold">{r.pedidoDianteiro}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-300 font-bold">{r.pedidoTraseiro}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-300 font-bold">{r.pedidoCoxao}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-blue-900 dark:text-blue-300 font-bold">{r.pedidoAlcatrao}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 bg-blue-100/40 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 font-bold">{r.boi}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400 font-semibold">{r.venda ?? r.boiAVenda}</td>
                        <td className={`px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold ${r.sugestaoPedido < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {r.sugestaoPedido > 0 ? `+${r.sugestaoPedido}` : r.sugestaoPedido}
                        </td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{r.camaraDianteiro}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-amber-600">{r.somaDoTraseiro}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{r.alcatra}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{r.contraFile}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{r.paletaPecas}</td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">{r.chaPecas}</td>
                        <td className="px-2 py-1.5 text-center">{r.bandaPecas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: LISTA DE VERSÕES COM FILTRO POR DATA */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-4 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
              
              {/* General Search */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por título, autor ou notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Exact Date Filter - Destaque solicitado: "e importante que data seja gravada para localização" */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar Data (DD/MM/AAAA)..."
                    value={specificDateSearch}
                    onChange={(e) => setSpecificDateSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  {specificDateSearch && (
                    <button
                      onClick={() => setSpecificDateSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Date Range Pills */}
                <div className="flex items-center bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] font-semibold">
                  <button
                    onClick={() => setSelectedDateFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition ${selectedDateFilter === 'ALL' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setSelectedDateFilter('TODAY')}
                    className={`px-2.5 py-1 rounded-lg transition ${selectedDateFilter === 'TODAY' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setSelectedDateFilter('7DAYS')}
                    className={`px-2.5 py-1 rounded-lg transition ${selectedDateFilter === '7DAYS' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    7 Dias
                  </button>
                </div>
              </div>
            </div>

            {/* List of Saved Snapshots */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredSnapshots.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400 space-y-2">
                  <History className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600" />
                  <p className="text-sm font-semibold">Nenhuma versão salva encontrada para os critérios informados</p>
                  <p className="text-xs">Clique no botão "Salvar Planilha" na aba da Planilha de Compras para gerar novas gravações no histórico.</p>
                </div>
              ) : (
                filteredSnapshots.map((snap) => (
                  <div 
                    key={snap.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left Info: Date and Name */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Prominent Date Tag for Location */}
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5" />
                          {snap.date}
                        </span>

                        {getSourceBadge(snap.source)}

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {snap.author}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {snap.name}
                      </h4>

                      {snap.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                          "{snap.notes}"
                        </p>
                      )}

                      {/* Summary Metrics Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
                          {snap.totalStores} Filiais
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
                          {snap.totalPieces} Peças
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-900">
                          {snap.totalBois} Bois
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900">
                          {snap.totalKg.toFixed(0)} kg
                        </span>
                        {snap.totalPurchaseR$ > 0 && (
                          <span className="text-slate-600 dark:text-slate-300 text-[11px] font-sans font-medium">
                            {formatCurrencyBRL(snap.totalPurchaseR$)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setInspectingSnapshot(snap)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Visualizar e conferir todos os dados gravados desta planilha"
                      >
                        <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Visualizar</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja restaurar a planilha gravada em ${snap.date} para a Planilha Ativa de Compras?`)) {
                            onRestoreSnapshot(snap);
                            onClose();
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Restaurar dados desta versão na Planilha Oficial"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        onClick={() => handleExportSnapshotCSV(snap)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Exportar CSV desta versão"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {snapshots.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja excluir do histórico a versão gravada em ${snap.date}?`)) {
                              onDeleteSnapshot(snap.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Excluir esta versão do histórico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
