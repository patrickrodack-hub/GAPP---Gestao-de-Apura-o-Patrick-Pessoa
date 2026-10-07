import React, { useState } from 'react';
import { StockLaunchRecord, Store } from '../../types/erp';
import { 
  History, 
  Calendar, 
  User, 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Beef, 
  Scissors, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Download,
  Sun,
  Moon,
  Globe,
  ExternalLink,
  Send
} from 'lucide-react';
import { formatNumberBR } from '../../services/calculationService';
import { PortalTheme } from './MobileStockPortal';
import { PortalLaunchPdfService } from '../../services/portalLaunchPdfService';

interface PortalLaunchHistoryProps {
  history: StockLaunchRecord[];
  stores: Store[];
  onClose: () => void;
  onRestoreLaunch?: (record: StockLaunchRecord) => void;
  theme: PortalTheme;
  onToggleTheme: () => void;
}

export const PortalLaunchHistory: React.FC<PortalLaunchHistoryProps> = ({
  history,
  stores,
  onClose,
  onRestoreLaunch,
  theme,
  onToggleTheme
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(history[0]?.id || null);

  const filteredHistory = history.filter(item => {
    const matchSearch = item.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.date.includes(searchTerm);
    const matchStore = selectedStoreFilter === 'ALL' || item.storeId === selectedStoreFilter;
    return matchSearch && matchStore;
  });

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Voltar ao Formulário"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Histórico de Lançamentos</h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Consultas dos envios sincronizados com a Planilha Matriz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Link para o site oficial */}
          <a
            href="https://gipp-site.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Acessar nosso site oficial: https://gipp-site.vercel.app/"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Nosso Site</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            {history.length} {history.length === 1 ? 'Envio' : 'Envios'}
          </span>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center gap-3 shrink-0">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por loja, operador ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value)}
            className="w-full sm:w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">Todas as Lojas</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600" />
            <p className="text-sm font-semibold">Nenhum lançamento encontrado</p>
            <p className="text-xs">Os novos estoques salvos no portal aparecerão listados aqui.</p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isExpanded = expandedId === item.id;
            const row = item.rowData;

            return (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden transition shadow-sm hover:shadow"
              >
                {/* Summary Header */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">{item.storeName}</strong>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                          Sincronizado
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          {item.operatorName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono text-xs">
                      <span className="text-amber-700 dark:text-amber-400 font-bold block">{item.boisEquivalente} bois</span>
                      <span className="text-[10px] text-slate-500">{item.totalPieces} peças</span>
                    </div>

                    <button className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && row && (
                  <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 space-y-4 text-xs font-mono">
                    {item.notes && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-sans mt-3">
                        <strong className="text-slate-800 dark:text-slate-300 block mb-0.5">Observação do Lançamento:</strong>
                        {item.notes}
                      </div>
                    )}

                    {/* 1. Peça Inteira Câmara */}
                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider font-sans">
                        <span className="flex items-center gap-1.5">
                          <Beef className="w-3.5 h-3.5" />
                          1. Carne Bovina (Peça Inteira Câmara)
                        </span>
                        <span>Total Câm: {row.camaraDianteiro + row.somaDoTraseiro + row.camaraCostelaGaucha} pç</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Dianteiro:</span>
                          <strong className="text-slate-900 dark:text-white">{row.camaraDianteiro} pç</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Traseiro:</span>
                          <strong className="text-slate-900 dark:text-white">{row.camaraTraseiro} pç</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Coxão:</span>
                          <strong className="text-slate-900 dark:text-white">{row.camaraCoxao} pç</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Alcatrão:</span>
                          <strong className="text-slate-900 dark:text-white">{row.camaraAlcatrao} pç</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Costela Gaúcha:</span>
                          <strong className="text-slate-900 dark:text-white">{row.camaraCostelaGaucha} pç</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex justify-between text-blue-900 dark:text-blue-300">
                          <span className="font-sans">P. Trânsito:</span>
                          <strong>{row.pTransito} pç</strong>
                        </div>
                      </div>
                    </div>

                    {/* 2. Desossa Balcão */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-sans">
                        <span className="flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5" />
                          2. Carne Bovina Desossa Balcão
                        </span>
                        <span>Tot. Desossa: {row.totalAlcatrao + row.totalDianteiro + row.totalCoxao} pç</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Alcatra:</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">{row.alcatra} pç ({row.alcatraKg}kg)</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Contra Filé:</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">{row.contraFile} pç ({row.contraFileKg}kg)</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Picanha:</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">{row.picanha} pç ({row.picanhaKg}kg)</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Filé Mignon:</span>
                          <strong className="text-emerald-700 dark:text-emerald-400">{row.fileMignon} pç ({row.fileMignonKg}kg)</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3. Suíno */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider font-sans">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          3. Carne Suína Desossa Balcão
                        </span>
                        <span>Sugestão: {row.bandaSugestao} pç</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Banda Suína:</span>
                          <strong className="text-teal-700 dark:text-teal-400">{row.bandaPecas} pç ({row.bandaKg}kg)</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Costela Suína:</span>
                          <strong className="text-teal-700 dark:text-teal-400">{row.costelaSuinaPecas} pç</strong>
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between shadow-2xs">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Pernil:</span>
                          <strong className="text-teal-700 dark:text-teal-400">{row.pernilPecas} pç</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions: WhatsApp PDF, Download PDF and Restore */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const currentStore = stores.find(s => s.id === item.storeId) || {
                              id: item.storeId,
                              code: 'FILIAL',
                              name: item.storeName,
                              city: 'Rio de Janeiro',
                              initialOrders: { dianteiro: 0, traseiro: 0, costelaGaucha: 0 }
                            };
                            PortalLaunchPdfService.shareLaunchViaWhatsApp({
                              record: item,
                              store: currentStore,
                              operatorName: item.operatorName,
                              notes: item.notes
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="Reenviar este Extrato em PDF via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp (PDF)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const currentStore = stores.find(s => s.id === item.storeId) || {
                              id: item.storeId,
                              code: 'FILIAL',
                              name: item.storeName,
                              city: 'Rio de Janeiro',
                              initialOrders: { dianteiro: 0, traseiro: 0, costelaGaucha: 0 }
                            };
                            PortalLaunchPdfService.downloadLaunchPdf({
                              record: item,
                              store: currentStore,
                              operatorName: item.operatorName,
                              notes: item.notes
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          title="Baixar Extrato Oficial em PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Baixar PDF</span>
                        </button>
                      </div>

                      {onRestoreLaunch && (
                        <button
                          type="button"
                          onClick={() => {
                            onRestoreLaunch(item);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Carregar no formulário</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
