import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Boxes,
  Scissors,
  DollarSign,
  ShoppingCart,
  Activity,
  Bone,
  SlidersHorizontal,
  Smartphone,
  Cloud,
  Printer,
  Calculator,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Lock,
  Sparkles,
  LogOut,
  X
} from 'lucide-react';
import { NavigationTab } from '../Navigation';
import { SystemUser } from '../../types/erp';

interface GappNewSidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: SystemUser | null;
  storeCount: number;
  onOpenPurchaseOrder: () => void;
  onPrint: () => void;
  onOpenQuickCalc: () => void;
  onOpenManuals: () => void;
  onOpenMobilePortal: () => void;
  onExitSystem: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const GappNewSidebar: React.FC<GappNewSidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  storeCount,
  onOpenPurchaseOrder,
  onPrint,
  onOpenQuickCalc,
  onOpenManuals,
  onOpenMobilePortal,
  onExitSystem,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(true);

  const hasPermission = (tabId: string) => {
    if (!currentUser) return true;
    if (currentUser.role === 'DESENVOLVEDOR') return true;
    return currentUser.allowedModules?.includes(tabId);
  };

  const mainMenuItems: {
    id: NavigationTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sheet', label: 'Planilha Direção', icon: FileSpreadsheet, badge: `${storeCount}` },
    { id: 'inventory', label: 'Estoque & Câmaras', icon: Boxes },
    { id: 'yield', label: 'Desossa & Rendimento', icon: Scissors },
    { id: 'results', label: 'Apuração & Margens', icon: DollarSign },
    { id: 'purchases', label: 'Compras & Lotes', icon: ShoppingCart },
    { id: 'quotes', label: 'Cotações Ao Vivo', icon: Activity },
    { id: 'waste', label: 'Descarte (Sebo/Osso)', icon: Bone },
  ];

  const configMenuItems: {
    id: NavigationTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'parameters', label: 'Parâmetros & Lojas', icon: SlidersHorizontal },
    { id: 'devices', label: 'Aparelhos Conectados', icon: Smartphone },
    { id: 'backup', label: 'Backup em Nuvem', icon: Cloud },
  ];

  const getActiveTabBreadcrumb = () => {
    const foundMain = mainMenuItems.find(i => i.id === activeTab);
    if (foundMain) return foundMain.label;
    const foundConfig = configMenuItems.find(i => i.id === activeTab);
    if (foundConfig) return foundConfig.label;
    return 'Dashboard';
  };

  const handleSelectTab = (tab: NavigationTab) => {
    if (!hasPermission(tab)) return;
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <aside className="w-[264px] h-full bg-white border-r border-[#e4e9e5] flex flex-col justify-between select-none shrink-0">
      {/* Top Brand + Greeting + Navigation */}
      <div className="p-5 flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar">
        {/* 1. Brand Header (Hope Pro inspired GAPP Pro header) */}
        <div className="flex items-center justify-between pb-4 border-b border-[#edf1ee]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#113829] text-white flex items-center justify-center shadow-sm shrink-0">
              <span className="font-black text-base tracking-tighter text-[#b5e550]">G</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#0f291e]">GAPP</span>
              <span className="px-2 py-0.5 rounded-md bg-[#b5e550] text-[#113829] font-extrabold text-[10px] leading-none">
                Pro
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <span>Matriz</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden ml-1 p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                title="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Breadcrumb & Personalized Welcome */}
        <div className="pt-4 pb-5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
            <span>Início</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-[#113829] font-semibold">{getActiveTabBreadcrumb()}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 leading-snug">Bem-vindo de volta,</p>
          <h2 className="text-[19px] font-extrabold text-[#0f291e] tracking-tight leading-tight truncate mt-0.5">
            {currentUser?.name || 'Patrick Pessoa'}
          </h2>
        </div>

        {/* 3. Main Menu Section */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
            className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 mb-2 px-2 cursor-pointer"
          >
            <span>Menu Principal</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isMainMenuOpen ? '' : '-rotate-90'
              }`}
            />
          </button>

          {isMainMenuOpen && (
            <nav className="space-y-1" aria-label="Menu Principal GAPP-NEW">
              {mainMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const allowed = hasPermission(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!allowed}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      !allowed
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isActive
                        ? 'bg-[#113829] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {!allowed ? (
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#b5e550]' : 'text-slate-500'
                          }`}
                        />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>

                    {isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-[#b5e550] shrink-0" />
                    ) : item.badge ? (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* 4. Help & Settings Section */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
            className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 mb-2 px-2 cursor-pointer"
          >
            <span>Ajuda & Configurações</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isHelpMenuOpen ? '' : '-rotate-90'
              }`}
            />
          </button>

          {isHelpMenuOpen && (
            <div className="space-y-1">
              {configMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const allowed = hasPermission(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!allowed}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      !allowed
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isActive
                        ? 'bg-[#113829] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#b5e550]' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#b5e550] shrink-0" />}
                  </button>
                );
              })}

              {/* Quick Modals Triggers */}
              <button
                type="button"
                onClick={() => {
                  onPrint();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Printer className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">Relatório Oficial (PDF)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenQuickCalc();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calculator className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">Calculadora Rápida</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenManuals();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">Manuais & Ajuda</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Textured Forest Green Action Card (Matches bottom-left card in reference image) */}
      <div className="p-4 pt-0">
        <div
          className="relative rounded-3xl p-4 text-white overflow-hidden shadow-md"
          style={{
            backgroundColor: '#113829',
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(181, 229, 80, 0.07) 0px, rgba(181, 229, 80, 0.07) 8px, transparent 8px, transparent 16px)'
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-8 h-8 rounded-full bg-[#b5e550] text-[#113829] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <button
              type="button"
              onClick={onOpenMobilePortal}
              className="text-[10px] font-bold text-[#b5e550] hover:underline cursor-pointer"
              title="Abrir Portal Mobile das Lojas"
            >
              Portal Lojas →
            </button>
          </div>

          <h3 className="text-sm font-extrabold tracking-tight leading-snug">
            Fechar Pedido Geral
          </h3>
          <p className="text-[11px] text-emerald-100/80 mt-1 leading-relaxed">
            Consolide o pedido das {storeCount} filiais com cálculo de Boi e Suíno.
          </p>

          <button
            type="button"
            onClick={() => {
              onOpenPurchaseOrder();
              if (onCloseMobile) onCloseMobile();
            }}
            className="mt-3.5 w-full py-2.5 px-3 rounded-full bg-white hover:bg-[#b5e550] text-[#113829] font-extrabold text-xs transition-colors shadow-sm cursor-pointer text-center"
          >
            Emitir Pedido Agora
          </button>
        </div>

        {/* Subtle Logout / Exit row at very bottom */}
        <div className="mt-2.5 px-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>GAPP Sistemas v10.8</span>
          <button
            type="button"
            onClick={onExitSystem}
            className="flex items-center gap-1 text-slate-500 hover:text-rose-600 font-semibold transition cursor-pointer"
            title="Sair ou encerrar sessão"
          >
            <LogOut className="w-3 h-3" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:block h-full shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[9998] lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
