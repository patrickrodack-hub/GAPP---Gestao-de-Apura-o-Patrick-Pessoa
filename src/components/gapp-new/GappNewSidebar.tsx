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
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Sparkles,
  LogOut,
  X,
  Layers,
  Truck
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface FloatingTooltipState {
  label: string;
  badge?: string;
  top: number;
  left: number;
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
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(true);
  const [floatingTooltip, setFloatingTooltip] = useState<FloatingTooltipState | null>(null);

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
    { id: 'slaughterhouse_order', label: 'Pedido por Frigorífico', icon: Truck, badge: 'Cortes' },
    { id: 'quotes', label: 'Cotações Ao Vivo', icon: Activity },
    { id: 'perishables', label: 'Cotação de Perecíveis', icon: Layers, badge: '11 Abas' },
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
    setFloatingTooltip(null);
    if (onCloseMobile) onCloseMobile();
  };

  const showTooltip = (e: React.MouseEvent<HTMLElement>, label: string, badge?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFloatingTooltip({
      label,
      badge,
      top: rect.top + rect.height / 2,
      left: rect.right + 10
    });
  };

  const hideTooltip = () => {
    setFloatingTooltip(null);
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => {
    const collapsed = !isMobileDrawer && isCollapsed;

    return (
      <aside
        className={`${
          collapsed ? 'w-[74px]' : 'w-[264px]'
        } h-full bg-white border-r border-[#e4e9e5] flex flex-col justify-between select-none shrink-0 transition-all duration-200 ease-in-out`}
      >
        {/* Top Brand + Greeting + Navigation */}
        <div
          className={`${
            collapsed ? 'px-2.5 py-4' : 'p-5'
          } flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar`}
        >
          {/* 1. Brand Header */}
          <div
            className={`flex items-center ${
              collapsed ? 'flex-col gap-2.5 pb-3' : 'justify-between pb-4'
            } border-b border-[#edf1ee]`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-full bg-[#113829] text-white flex items-center justify-center shadow-sm shrink-0"
                title="GAPP Pro — Gestão Apuração do Boi"
              >
                <span className="font-black text-base tracking-tighter text-[#b5e550]">G</span>
              </div>
              {!collapsed && (
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#0f291e]">GAPP</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#b5e550] text-[#113829] font-extrabold text-[10px] leading-none">
                    Pro
                  </span>
                </div>
              )}
            </div>

            {collapsed ? (
              onToggleCollapse && (
                <button
                  type="button"
                  onClick={() => {
                    hideTooltip();
                    onToggleCollapse();
                  }}
                  onMouseEnter={(e) => showTooltip(e, 'Restaurar Menu Lateral')}
                  onMouseLeave={hideTooltip}
                  className="w-9 h-8 rounded-xl bg-[#eff3ef] hover:bg-[#113829] text-[#113829] hover:text-[#b5e550] flex items-center justify-center transition-colors cursor-pointer"
                  title="Restaurar barra lateral completa"
                  aria-label="Restaurar barra lateral"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <span className="hidden sm:inline">Matriz</span>
                {!isMobileDrawer && onToggleCollapse && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="ml-1 p-1.5 rounded-lg bg-[#f4f6f4] hover:bg-[#113829] text-slate-500 hover:text-[#b5e550] transition-colors cursor-pointer"
                    title="Minimizar menu lateral para ampliar área de trabalho"
                    aria-label="Minimizar menu lateral"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}
                {isMobileDrawer && onCloseMobile && (
                  <button
                    type="button"
                    onClick={onCloseMobile}
                    className="lg:hidden ml-1 p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                    title="Fechar menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Breadcrumb & Personalized Welcome (hidden when minimized) */}
          {!collapsed && (
            <div className="pt-4 pb-5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
                <span>Início</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-[#113829] font-semibold truncate">{getActiveTabBreadcrumb()}</span>
              </div>
              <p className="text-xs font-medium text-slate-500 leading-snug">Bem-vindo de volta,</p>
              <h2 className="text-[19px] font-extrabold text-[#0f291e] tracking-tight leading-tight truncate mt-0.5">
                {currentUser?.name || 'Patrick Pessoa'}
              </h2>
            </div>
          )}

          {/* 3. Main Menu Section */}
          <div className={collapsed ? 'mt-3 mb-3' : 'mb-4'}>
            {!collapsed && (
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
            )}

            {(collapsed || isMainMenuOpen) && (
              <nav
                className={collapsed ? 'flex flex-col items-center gap-1.5' : 'space-y-1'}
                aria-label="Menu Principal GAPP-NEW"
              >
                {mainMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const allowed = hasPermission(item.id);

                  if (collapsed) {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!allowed}
                        onClick={() => handleSelectTab(item.id)}
                        onMouseEnter={(e) => showTooltip(e, item.label, item.badge)}
                        onMouseLeave={hideTooltip}
                        title={item.badge ? `${item.label} (${item.badge})` : item.label}
                        className={`w-11 h-10 rounded-2xl flex items-center justify-center relative transition-all cursor-pointer ${
                          !allowed
                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                            : isActive
                            ? 'bg-[#113829] text-white shadow-sm ring-2 ring-[#b5e550]/40'
                            : 'text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829]'
                        }`}
                      >
                        {!allowed ? (
                          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <Icon
                            className={`w-[18px] h-[18px] shrink-0 ${
                              isActive ? 'text-[#b5e550]' : 'text-slate-500'
                            }`}
                          />
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!allowed}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
                        <span className="text-[10px] font-mono font-bold text-slate-400 whitespace-nowrap shrink-0">
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
          <div className={collapsed ? 'pt-2.5 border-t border-[#edf1ee] mb-2' : 'mb-4'}>
            {!collapsed && (
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
            )}

            {(collapsed || isHelpMenuOpen) && (
              <div className={collapsed ? 'flex flex-col items-center gap-1.5' : 'space-y-1'}>
                {configMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const allowed = hasPermission(item.id);

                  if (collapsed) {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!allowed}
                        onClick={() => handleSelectTab(item.id)}
                        onMouseEnter={(e) => showTooltip(e, item.label)}
                        onMouseLeave={hideTooltip}
                        title={item.label}
                        className={`w-11 h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                          !allowed
                            ? 'opacity-40 cursor-not-allowed text-slate-400'
                            : isActive
                            ? 'bg-[#113829] text-white shadow-sm'
                            : 'text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829]'
                        }`}
                      >
                        <Icon
                          className={`w-[17px] h-[17px] shrink-0 ${
                            isActive ? 'text-[#b5e550]' : 'text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  }

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
                {collapsed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        hideTooltip();
                        onPrint();
                      }}
                      onMouseEnter={(e) => showTooltip(e, 'Relatório Oficial (PDF)')}
                      onMouseLeave={hideTooltip}
                      title="Relatório Oficial (PDF)"
                      className="w-11 h-9 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829] transition-all cursor-pointer"
                    >
                      <Printer className="w-[17px] h-[17px] text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        hideTooltip();
                        onOpenQuickCalc();
                      }}
                      onMouseEnter={(e) => showTooltip(e, 'Calculadora Rápida')}
                      onMouseLeave={hideTooltip}
                      title="Calculadora Rápida"
                      className="w-11 h-9 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829] transition-all cursor-pointer"
                    >
                      <Calculator className="w-[17px] h-[17px] text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        hideTooltip();
                        onOpenManuals();
                      }}
                      onMouseEnter={(e) => showTooltip(e, 'Manuais & Ajuda')}
                      onMouseLeave={hideTooltip}
                      title="Manuais & Ajuda"
                      className="w-11 h-9 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-[#f4f6f4] hover:text-[#113829] transition-all cursor-pointer"
                    >
                      <BookOpen className="w-[17px] h-[17px] text-slate-500" />
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 5. Bottom Textured Forest Green Action Card (Compact vs Full) */}
        {collapsed ? (
          <div className="px-2.5 py-3 border-t border-[#edf1ee] flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                hideTooltip();
                onOpenPurchaseOrder();
              }}
              onMouseEnter={(e) => showTooltip(e, 'Fechar Pedido Geral')}
              onMouseLeave={hideTooltip}
              title="Emitir Pedido Agora (Fechar Pedido Geral)"
              className="w-11 h-11 rounded-2xl bg-[#113829] hover:bg-[#194d38] text-[#b5e550] flex items-center justify-center shadow-md transition-colors cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                hideTooltip();
                onExitSystem();
              }}
              onMouseEnter={(e) => showTooltip(e, 'Sair do Sistema')}
              onMouseLeave={hideTooltip}
              title="Sair ou encerrar sessão"
              className="w-11 h-9 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-4 pt-2 border-t border-[#edf1ee]/70 bg-white">
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
              <span>GAPP Sistemas v11.1</span>
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
        )}
      </aside>
    );
  };

  return (
    <>
      {/* Desktop Fixed / Collapsible Sidebar with Floating Edge Handle */}
      <div className="hidden lg:block relative h-full shrink-0">
        {renderSidebarContent(false)}

        {/* Botão flutuante na borda lateral para Minimizar / Restaurar com 1 clique */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={() => {
              hideTooltip();
              onToggleCollapse();
            }}
            className="absolute -right-3 top-7 z-40 w-6 h-6 rounded-full bg-white border border-[#dfe5e0] shadow-md text-[#113829] hover:bg-[#113829] hover:text-[#b5e550] flex items-center justify-center transition-colors cursor-pointer"
            title={
              isCollapsed
                ? 'Restaurar barra de menu lateral'
                : 'Minimizar barra de menu lateral'
            }
            aria-label={
              isCollapsed
                ? 'Restaurar barra de menu lateral'
                : 'Minimizar barra de menu lateral'
            }
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Tooltip Flutuante no modo Minimizado */}
      {isCollapsed && floatingTooltip && (
        <div
          className="hidden lg:flex fixed z-[10050] -translate-y-1/2 items-center gap-2 px-3 py-1.5 rounded-xl bg-[#113829] text-white text-xs font-bold shadow-xl border border-[#b5e550]/30 pointer-events-none whitespace-nowrap"
          style={{
            top: `${floatingTooltip.top}px`,
            left: `${floatingTooltip.left}px`
          }}
        >
          <span>{floatingTooltip.label}</span>
          {floatingTooltip.badge && (
            <span className="px-1.5 py-0.5 rounded bg-[#b5e550] text-[#113829] text-[10px] font-mono font-extrabold">
              {floatingTooltip.badge}
            </span>
          )}
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[9998] lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{renderSidebarContent(true)}</div>
        </div>
      )}
    </>
  );
};
