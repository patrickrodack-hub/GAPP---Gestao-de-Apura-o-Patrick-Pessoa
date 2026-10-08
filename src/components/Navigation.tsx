import React from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Scissors, 
  DollarSign, 
  Boxes, 
  ShoppingCart, 
  Bone, 
  SlidersHorizontal,
  Lock,
  Cloud,
  Activity,
  Smartphone
} from 'lucide-react';
import { SystemUser } from '../types/erp';

export type NavigationTab = 
  | 'dashboard'
  | 'sheet'
  | 'quotes'
  | 'yield'
  | 'results'
  | 'inventory'
  | 'purchases'
  | 'waste'
  | 'parameters'
  | 'backup'
  | 'devices';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser?: SystemUser | null;
  onOpenUserManagement?: () => void;
  onOpenShortcuts?: () => void;
  onExitSystem?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  currentUser 
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, badge: null, shortcut: 'Alt+1' },
    { id: 'sheet', label: 'Planilha Direção v10.7', icon: FileSpreadsheet, badge: '16 Lojas', shortcut: 'Alt+2' },
    { id: 'quotes', label: 'Cotação em Tempo Real', icon: Activity, badge: 'Ao Vivo', shortcut: 'Alt+0' },
    { id: 'yield', label: 'Desossa & Rendimento', icon: Scissors, badge: 'Calculadora', shortcut: 'Alt+3' },
    { id: 'results', label: 'Apuração & Margens', icon: DollarSign, badge: 'DRE', shortcut: 'Alt+4' },
    { id: 'inventory', label: 'Estoque & Câmaras', icon: Boxes, badge: null, shortcut: 'Alt+5' },
    { id: 'purchases', label: 'Compras & Lotes', icon: ShoppingCart, badge: null, shortcut: 'Alt+6' },
    { id: 'waste', label: 'Descarte (Sebo & Osso)', icon: Bone, badge: null, shortcut: 'Alt+7' },
    { id: 'devices', label: 'Aparelhos Conectados', icon: Smartphone, badge: 'Acessos', shortcut: 'Alt+M' },
    { id: 'parameters', label: 'Módulo 1: Cadastros', icon: SlidersHorizontal, badge: 'Setup', shortcut: 'Alt+8' },
    { id: 'backup', label: 'Backup Online', icon: Cloud, badge: 'Nuvem', shortcut: 'Alt+9' },
  ];

  const hasPermission = (tabId: string) => {
    if (!currentUser) return true;
    if (currentUser.role === 'DESENVOLVEDOR') return true;
    return currentUser.allowedModules?.includes(tabId);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex items-center">
        <nav className="flex space-x-1 overflow-x-auto py-2.5 no-scrollbar w-full" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isAllowed = hasPermission(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isAllowed) {
                    onTabChange(tab.id as NavigationTab);
                  }
                }}
                disabled={!isAllowed}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 group
                  ${!isAllowed 
                    ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600' 
                    : isActive 
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-900/10' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'}
                `}
                title={isAllowed ? `${tab.label} (Atalho: ${tab.shortcut})` : `${tab.label} (Módulo bloqueado para seu perfil)`}
              >
                {!isAllowed ? (
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
                )}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    isActive 
                      ? 'bg-amber-500/25 text-amber-800 dark:text-amber-300' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {/* Shortcut hotkey badge */}
                {isAllowed && (
                  <kbd className={`hidden md:inline text-[9px] font-mono px-1 py-0.2 rounded transition ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {tab.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
