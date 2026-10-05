import React from 'react';
import { NavigationTab } from '../Navigation';
import { 
  Keyboard, 
  X, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Scissors, 
  DollarSign, 
  Boxes, 
  ShoppingCart, 
  Bone, 
  SlidersHorizontal,
  Download,
  Printer,
  Calculator,
  Monitor,
  Table,
  Building2,
  Power
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: NavigationTab) => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const moduleShortcuts: { key: string; label: string; tabId: NavigationTab; icon: any; highlight?: boolean }[] = [
    { key: 'Alt + 1', label: 'Painel Executivo Geral (Dashboard)', tabId: 'dashboard', icon: LayoutDashboard },
    { key: 'Alt + 2', label: 'Planilha de Compra da Direção v10.1', tabId: 'sheet', icon: FileSpreadsheet, highlight: true },
    { key: 'Alt + 3', label: 'Desossa & Rendimento Zootécnico', tabId: 'yield', icon: Scissors },
    { key: 'Alt + 4', label: 'DRE & Apuração de Margens', tabId: 'results', icon: DollarSign },
    { key: 'Alt + 5', label: 'Estoque & Câmaras Frias (16 Lojas)', tabId: 'inventory', icon: Boxes },
    { key: 'Alt + 6', label: 'Gestão de Compras & Lotes Frigoríficos', tabId: 'purchases', icon: ShoppingCart },
    { key: 'Alt + 7', label: 'Controle de Descarte (Sebo e Osso)', tabId: 'waste', icon: Bone },
    { key: 'Alt + 8', label: 'Módulo 1: Cadastro & Parâmetros', tabId: 'parameters', icon: SlidersHorizontal },
  ];

  const actionShortcuts = [
    { key: 'Alt + G', label: 'Gerar Pedido de Compra Padrão (16 Filiais)', icon: ShoppingCart },
    { key: 'Alt + F', label: 'Cadastro de Fornecedores e Frigoríficos', icon: Building2 },
    { key: 'Alt + X', label: 'Exportar para Excel (.xlsx estruturado com fórmulas)', icon: Download },
    { key: 'Alt + C', label: 'Abrir Calculadora Rápida de Desossa', icon: Calculator },
    { key: 'Alt + P', label: 'Imprimir Relatório Executivo Oficial', icon: Printer },
    { key: 'Alt + T', label: 'Alternar Tema (Solidcon / Claro / Escuro)', icon: Monitor },
    { key: 'Alt + D', label: 'Alternar Janela / Área de Trabalho Metálica', icon: Table },
    { key: 'Alt + Q / Alt + F4', label: 'Sair do Sistema e Fechar Navegador', icon: Power },
    { key: 'F1 ou ?', label: 'Abrir este Guia de Atalhos', icon: Keyboard },
    { key: 'Esc', label: 'Fechar Modais / Cancelar Edição', icon: X },
  ];

  const sheetShortcuts = [
    { key: 'TAB', label: 'Avança para a próxima filial (linha) na mesma coluna (ou próximo campo)' },
    { key: 'Shift + TAB', label: 'Retorna para a filial anterior na mesma coluna' },
    { key: 'Enter / ↓', label: 'Confirma valor e desce para a próxima filial' },
    { key: 'Shift + Enter / ↑', label: 'Retorna para a filial acima' },
    { key: 'Auto-Select', label: 'O valor da célula é selecionado automaticamente ao focar' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Atalhos Globais de Teclado do ERP</h3>
              <p className="text-xs text-white/80">Grupo GAPP Sistemas • Apuração do Boi por Patrick Pessoa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Section 1: Modules Navigation */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Navegação Rápida entre Módulos (Alt + Número)
              </span>
              <span className="text-[10px] text-slate-400">Clique para ir ao módulo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {moduleShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onNavigateTab(item.tabId);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition group ${
                      item.highlight 
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition">
                        <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {item.label}
                      </span>
                    </div>

                    <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs font-mono font-bold text-[10px] text-slate-800 dark:text-slate-200 shrink-0">
                      {item.key}
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Global ERP Operations */}
          <div>
            <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Operações & Exportação
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs border border-slate-200 dark:border-slate-700">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.label}
                      </span>
                    </div>

                    <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs font-mono font-bold text-[10px] text-slate-800 dark:text-slate-200 shrink-0">
                      {item.key}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Spreadsheet Fast Typing */}
          <div>
            <div className="pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Digitação Rápida na Planilha Matriz
              </span>
            </div>

            <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
              {sheetShortcuts.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.label}
                  </span>
                  <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 font-mono font-bold text-[10px] text-amber-800 dark:text-amber-300 shrink-0 shadow-xs">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Dica: Os atalhos funcionam globalmente em qualquer tela do sistema.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
