import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Bell,
  ChevronDown,
  Menu,
  Printer,
  FileSpreadsheet,
  ShoppingCart,
  Cloud,
  Users,
  KeyRound,
  LogOut,
  Power,
  RotateCcw,
  Lock,
  Smartphone,
  Save,
  Building2,
  Package,
  Keyboard
} from 'lucide-react';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { SheetRowData, Store, SystemUser } from '../../types/erp';
import { NavigationTab } from '../Navigation';

interface GappNewTopBarProps {
  rows: SheetRowData[];
  stores: Store[];
  currentUser: SystemUser | null;
  isCloudConnected?: boolean;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenPurchaseOrder: () => void;
  onPrint: () => void;
  onExportXLSX: () => void;
  onSaveSheet: () => void;
  onOpenSupplierManager: () => void;
  onOpenProductManager: () => void;
  onOpenPortalControl: () => void;
  onOpenMobilePortal: () => void;
  onOpenBackup: () => void;
  onOpenShortcuts: () => void;
  onOpenUserManagement: () => void;
  onOpenChangePassword: () => void;
  onReset: () => void;
  onLogout: () => void;
  onExitSystem: () => void;
  onOpenMobileMenu: () => void;
}

export const GappNewTopBar: React.FC<GappNewTopBarProps> = ({
  rows,
  stores,
  currentUser,
  isCloudConnected = true,
  onNavigateTab,
  onOpenPurchaseOrder,
  onPrint,
  onExportXLSX,
  onSaveSheet,
  onOpenSupplierManager,
  onOpenProductManager,
  onOpenPortalControl,
  onOpenMobilePortal,
  onOpenBackup,
  onOpenShortcuts,
  onOpenUserManagement,
  onOpenChangePassword,
  onReset,
  onLogout,
  onExitSystem,
  onOpenMobileMenu
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Alt+S to focus global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows.slice(0, 6);
    return rows.filter(r => {
      const storeObj = stores.find(s => s.id === r.storeId);
      return (
        r.storeName.toLowerCase().includes(q) ||
        (storeObj?.manager && storeObj.manager.toLowerCase().includes(q)) ||
        (storeObj?.code && storeObj.code.toLowerCase().includes(q))
      );
    });
  }, [rows, stores, searchQuery]);

  const quickModules = useMemo(() => {
    const list: { label: string; desc: string; action: () => void }[] = [
      {
        label: 'Planilha Direção v10.9',
        desc: 'Editar pedidos de bovino, cortes e suíno das 16 lojas',
        action: () => onNavigateTab('sheet')
      },
      {
        label: 'Relatório Oficial de Pedido (PDF / Excel)',
        desc: 'Visualizar e exportar as 17 colunas oficiais',
        action: () => onPrint()
      },
      {
        label: 'Fechar Pedido de Compra',
        desc: 'Emitir ordem de compra por frigorífico',
        action: () => onOpenPurchaseOrder()
      },
      {
        label: 'Controle de Estoque & Câmaras Frias',
        desc: 'Conferir ocupação das câmaras das 16 filiais',
        action: () => onNavigateTab('inventory')
      },
      {
        label: 'Rendimento & Desossa do Boi',
        desc: 'Simulador de carcaça, dianteiro, traseiro e ponta de agulha',
        action: () => onNavigateTab('yield')
      },
      {
        label: 'Portal Mobile das Lojas',
        desc: 'Interface touch para lançamento de câmara pelos encarregados',
        action: () => onOpenMobilePortal()
      }
    ];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list.slice(0, 4);
    return list.filter(
      m => m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
    );
  }, [searchQuery, onNavigateTab, onPrint, onOpenPurchaseOrder, onOpenMobilePortal]);

  const userInitials = useMemo(() => {
    const name = currentUser?.name || 'Patrick Pessoa';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [currentUser]);

  return (
    <header className="w-full bg-white border-b border-[#e4e9e5] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile Menu Button + Rounded Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-10 w-10 rounded-full bg-[#f4f6f4] hover:bg-[#e6ebe7] flex items-center justify-center text-[#113829] cursor-pointer shrink-0"
          title="Abrir menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Pesquisar filial, encarregado, corte ou ferramenta..."
              className="w-full h-10 pl-10 pr-14 rounded-full bg-[#f4f6f4] hover:bg-[#edf1ee] focus:bg-white border border-transparent focus:border-[#113829]/30 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-mono font-semibold text-slate-500 absolute right-2.5 shadow-2xs">
              ⌘K
            </kbd>
          </div>

          {/* Global Search Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-[#dfe5e0] rounded-2xl shadow-2xl z-[9999] p-3 text-xs max-h-[75vh] overflow-y-auto">
              <div className="mb-2.5">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Filiais & Apuração ({filteredStores.length})</span>
                  <span>Clique para abrir na Planilha</span>
                </div>
                <div className="mt-1 space-y-1">
                  {filteredStores.map(r => {
                    const boiCalc = Math.round(
                      r.boi !== undefined
                        ? r.boi
                        : (r.pedidoDianteiro +
                            r.pedidoTraseiro +
                            r.pedidoCoxao +
                            r.pedidoAlcatrao) /
                            2
                    );
                    const sujestao = Math.round(
                      r.sugestaoPedido !== undefined
                        ? r.sugestaoPedido
                        : (r.venda || r.boiAVenda || 0) - boiCalc
                    );
                    const pedBoi = r.pedidoFinal || 0;
                    const pedSuino = r.bandaPedido || r.pedidoSuino || 0;

                    return (
                      <button
                        key={r.storeId}
                        type="button"
                        onClick={() => {
                          onNavigateTab('sheet');
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f4f6f4] text-left transition cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{r.storeName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Boi Calc: {boiCalc} · Sugestão: {sujestao} · Venda: {Math.round(r.venda || r.boiAVenda || 0)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[#113829] font-extrabold">
                            Ped. Boi: {pedBoi}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-teal-700 font-bold">
                            Suíno: {pedSuino}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {quickModules.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Acesso Rápido a Ferramentas
                  </div>
                  <div className="mt-1 space-y-1">
                    {quickModules.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          m.action();
                          setIsSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f4f6f4] text-left transition cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-[#113829]">{m.label}</div>
                          <div className="text-[10px] text-slate-500">{m.desc}</div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Abrir →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Executive Pill Buttons, Theme Switcher, Notifications & User Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Dark Forest Pill Button (Matches "Hope AI" button in reference image) */}
        <button
          type="button"
          onClick={onOpenPurchaseOrder}
          className="hidden md:inline-flex h-10 px-4 rounded-full bg-[#113829] hover:bg-[#194d38] text-white text-xs font-bold items-center gap-2 shadow-xs transition cursor-pointer"
          title="Abrir Fechamento de Pedido de Compra (Bovino, Cortes e Suíno)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#b5e550]" />
          <span>Fechar Pedido</span>
        </button>

        {/* Official Report PDF/XLSX Button */}
        <button
          type="button"
          onClick={onPrint}
          className="hidden sm:inline-flex h-10 px-3.5 rounded-full bg-[#f4f6f4] hover:bg-[#e6ece7] border border-[#dfe5e0] text-[#113829] text-xs font-bold items-center gap-1.5 transition cursor-pointer"
          title="Abrir Relatório Oficial de Pedido (17 Colunas - PDF, Excel e WhatsApp)"
        >
          <Printer className="w-3.5 h-3.5 text-[#113829]" />
          <span>Relatório</span>
        </button>

        {/* Theme Switcher Pill */}
        <ThemeSwitcher variant="gapp-new-pill" />

        {/* Operational Tools & Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="h-10 w-10 rounded-full bg-[#f4f6f4] hover:bg-[#e6ece7] border border-[#dfe5e0] flex items-center justify-center text-slate-700 relative transition cursor-pointer"
            title="Central de Ações Rápidas e Status da Nuvem"
          >
            <Bell className="w-4 h-4 text-[#113829]" />
            <span
              className={`w-2 h-2 rounded-full absolute top-2.5 right-2.5 ${
                isCloudConnected ? 'bg-[#84cc16]' : 'bg-amber-500'
              }`}
            />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-2.5 text-xs text-slate-800">
              <div className="px-2.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-extrabold text-[#113829]">Ferramentas & Nuvem</span>
                <span className="text-[10px] font-semibold text-emerald-700">
                  {isCloudConnected ? '● Sincronizado' : '● Local'}
                </span>
              </div>

              <div className="mt-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onSaveSheet();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#113829]" />
                  <span>Salvar Snapshot da Planilha</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExportXLSX();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Exportar Planilha Completa (.XLSX)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenSupplierManager();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>Fornecedores & Frigoríficos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenProductManager();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Package className="w-4 h-4 text-slate-600" />
                  <span>Catálogo de Cortes & Produtos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenPortalControl();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Controle de Acesso Portal Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenBackup();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>Central de Backup Online</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenShortcuts();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Keyboard className="w-4 h-4 text-slate-500" />
                  <span>Atalhos de Teclado</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill (Matches top-right user profile in reference image) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full hover:bg-[#f4f6f4] border border-transparent hover:border-[#dfe5e0] transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#113829] text-[#b5e550] font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0">
              {userInitials}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-extrabold text-slate-900 leading-none">
                {currentUser?.name || 'Patrick Pessoa'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">
                {currentUser?.role || 'DIRETORIA'} · GAPP
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] p-2 text-xs text-slate-800">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <div className="font-extrabold text-slate-900">
                  {currentUser?.name || 'Patrick Pessoa'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Perfil: {currentUser?.role || 'DIRETOR'}
                </div>
              </div>

              <div className="mt-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenUserManagement();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#113829]" />
                  <span>Gerenciar Usuários & Acessos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenChangePassword();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-600" />
                  <span>Alterar Minha Senha</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenMobilePortal();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f4f6f4] text-left font-semibold transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>Alternar para Portal Mobile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-50 text-amber-800 text-left font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Restaurar Padrão da Planilha</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 text-left font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>Trocar Usuário (Logout)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onExitSystem();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 text-left font-bold transition cursor-pointer"
                >
                  <Power className="w-4 h-4 text-rose-600" />
                  <span>Encerrar Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
