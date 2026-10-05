import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NavigationTab } from '../Navigation';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { getERPMenuCategories, ERPMenuItem } from './menuData';
import { ERPMenuDialogs } from './ERPMenuDialogs';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { 
  FileSpreadsheet, 
  RotateCcw, 
  Download, 
  Printer, 
  Calculator, 
  Search,
  Plus,
  Save,
  DollarSign,
  Warehouse,
  Scissors,
  Scale,
  Truck,
  ArrowRightLeft,
  Bone,
  TrendingUp,
  SlidersHorizontal,
  LayoutDashboard,
  Layers,
  HelpCircle,
  FolderOpen,
  X,
  Minus,
  Square,
  Copy,
  ChevronRight,
  ShieldCheck,
  Building2,
  Keyboard,
  ShoppingCart,
  Smartphone,
  Clock,
  User,
  Users,
  LogOut,
  Power,
  ChevronDown,
  Terminal
} from 'lucide-react';
import { SystemUser } from '../../types/erp';

interface SolidconHeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onReset: () => void;
  onExportCSV: () => void;
  onExportXLSX?: () => void;
  onOpenQuickCalc: () => void;
  onPrint: () => void;
  isDesktopView: boolean;
  onToggleDesktop: () => void;
  storeCount: number;
  onOpenShortcuts?: () => void;
  onOpenPurchaseOrder?: () => void;
  onOpenSupplierManager?: () => void;
  onOpenMobilePortal?: () => void;
  onOpenPortalControl?: () => void;
  onSaveSheet?: () => void;
  currentUser?: SystemUser | null;
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
  onExitSystem?: () => void;
}

export const SolidconHeader: React.FC<SolidconHeaderProps> = ({
  activeTab,
  onTabChange,
  onReset,
  onExportCSV,
  onExportXLSX,
  onOpenQuickCalc,
  onPrint,
  isDesktopView,
  onToggleDesktop,
  storeCount,
  onOpenShortcuts,
  onOpenPurchaseOrder,
  onOpenSupplierManager,
  onOpenMobilePortal,
  onOpenPortalControl,
  onSaveSheet,
  currentUser,
  onOpenUserManagement,
  onLogout,
  onExitSystem,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'about' | 'shortcuts' | 'diagnostics' | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  const menuBarRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveDialog('shortcuts');
      } else if (e.key === 'F2') {
        e.preventDefault();
        onTabChange('sheet');
      } else if (e.key === 'F3') {
        e.preventDefault();
        onTabChange('dashboard');
      } else if (e.key === 'F4') {
        e.preventDefault();
        onOpenQuickCalc();
      } else if (e.key === 'F5') {
        e.preventDefault();
        onReset();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        onPrint();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        onExportCSV();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onTabChange('purchases');
      } else if (e.key === 'Escape') {
        setActiveMenu(null);
        setShowSearchBox(false);
        setActiveDialog(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange, onReset, onExportCSV, onOpenQuickCalc, onPrint]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearchBox && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBox]);

  const handleSaveData = () => {
    if (onSaveSheet) {
      onSaveSheet();
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Build menu categories and items
  const menuCategories = useMemo(() => {
    return getERPMenuCategories(
      onTabChange,
      onReset,
      onExportCSV,
      onOpenQuickCalc,
      onPrint,
      onToggleDesktop,
      () => setActiveDialog('about'),
      onOpenShortcuts || (() => setActiveDialog('shortcuts')),
      () => setActiveDialog('diagnostics'),
      storeCount,
      onExportXLSX
    );
  }, [onTabChange, onReset, onExportCSV, onOpenQuickCalc, onPrint, onToggleDesktop, storeCount, onExportXLSX, onOpenShortcuts]);

  // Execute an item action
  const handleItemClick = (item: ERPMenuItem) => {
    setActiveMenu(null);
    setShowSearchBox(false);

    if (item.actionType === 'tab' && item.targetTab) {
      onTabChange(item.targetTab);
    } else if (item.actionType === 'action') {
      switch (item.actionId) {
        case 'exportXLSX':
          if (onExportXLSX) onExportXLSX();
          break;
        case 'exportCSV':
          onExportCSV();
          break;
        case 'print':
          onPrint();
          break;
        case 'quickCalc':
          onOpenQuickCalc();
          break;
        case 'reset':
          onReset();
          break;
        case 'toggleDesktop':
          onToggleDesktop();
          break;
        case 'save':
          handleSaveData();
          break;
        case 'suppliers':
          if (onOpenSupplierManager) onOpenSupplierManager();
          break;
        case 'purchaseOrder':
          if (onOpenPurchaseOrder) onOpenPurchaseOrder();
          break;
        case 'portalControl':
          if (onOpenPortalControl) onOpenPortalControl();
          break;
        case 'mobilePortal':
          if (onOpenMobilePortal) onOpenMobilePortal();
          break;
        case 'exit':
          if (onExitSystem) onExitSystem();
          else if (onLogout) onLogout();
          break;
        default:
          break;
      }
    } else if (item.actionType === 'modal') {
      switch (item.actionId) {
        case 'about':
          setActiveDialog('about');
          break;
        case 'shortcuts':
          setActiveDialog('shortcuts');
          break;
        case 'diagnostics':
          setActiveDialog('diagnostics');
          break;
        default:
          break;
      }
    }
  };

  // All modules flattened for global search
  const allModules = useMemo(() => {
    const list: (ERPMenuItem & { categoryLabel: string })[] = [];
    menuCategories.forEach(cat => {
      cat.items.forEach(it => {
        list.push({ ...it, categoryLabel: cat.label });
      });
    });
    return list;
  }, [menuCategories]);

  // Filtered modules by query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allModules.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.division.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.categoryLabel.toLowerCase().includes(q)
    );
  }, [allModules, searchQuery]);

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'sheet': return 'Planilha de Compra da Direção da Empresa v10.1 - Matriz 16 Filiais';
      case 'dashboard': return 'Painel Executivo Geral - Apuração do Boi';
      case 'yield': return 'Análise Técnica de Rendimento, Desossa e Cortes';
      case 'results': return 'DRE Gerencial, Margens de Compra e Venda (Markup)';
      case 'inventory': return 'Controle de Estoque: Câmaras Frias, Desossa e Trânsito';
      case 'purchases': return 'Gestão de Compras de Gado e Lotes de Frigoríficos';
      case 'waste': return 'Controle de Subprodutos & Descarte (Sebo e Osso)';
      case 'parameters': return 'Módulo 1: Cadastro de Informações e Parâmetros (7 Etapas)';
      default: return 'Apuração do Boi';
    }
  };

  return (
    <>
      <header className="w-full select-none font-sans z-40 relative shadow-md">
        
        {/* Toast de Salvar */}
        {saveToast && (
          <div className="fixed top-12 right-5 z-50 bg-emerald-600 text-white px-4 py-2 rounded shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-400 animate-bounce">
            <span>✓ Todas as alterações foram sincronizadas e salvas na base local com sucesso!</span>
          </div>
        )}

        {/* 1. TOP WINDOW TITLE BAR (Windows Classic ERP Blue) */}
        <div 
          className="h-8 sm:h-9 px-2 flex items-center justify-between text-white text-xs font-semibold"
          style={{
            background: 'linear-gradient(90deg, #005a9e 0%, #0078d7 60%, #1084d8 100%)',
            borderBottom: '1px solid #004b87'
          }}
        >
          {/* Left: Window Icon + Title */}
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Official Patrick Pessoa Bull Emblem */}
            <div className="w-5 h-5 rounded-sm bg-[#0c140d] border border-white/40 flex items-center justify-center shrink-0 shadow-inner overflow-hidden p-0.5">
              <img src="/icon.svg" alt="Patrick Pessoa" className="w-full h-full object-contain" />
            </div>

            <span className="font-bold tracking-tight truncate text-[11px] sm:text-xs drop-shadow-sm">
              Grupo GAPP Sistemas - Apuração do Boi por Patrick Pessoa - [{isDesktopView ? 'Área de Trabalho' : getActiveTabTitle()}]
            </span>
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center -mr-1 shrink-0">
            <button
              onClick={onToggleDesktop}
              className="w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white transition text-xs"
              title={isDesktopView ? "Restaurar Janela do Sistema" : "Minimizar para Área de Trabalho"}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={onToggleDesktop}
              className="w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white transition text-xs"
              title={isDesktopView ? "Restaurar Módulo Ativo" : "Ver Área de Trabalho Metálica"}
            >
              {isDesktopView ? <Square className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>

            <button
              onClick={() => {
                if (window.confirm('Deseja fechar o módulo atual e retornar à Área de Trabalho?')) {
                  onToggleDesktop();
                }
              }}
              className="w-8 sm:w-9 h-8 sm:h-9 flex items-center justify-center hover:bg-red-600 active:bg-red-700 text-white transition text-xs"
              title="Fechar Janela"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. CLASSIC DESKTOP MENU BAR - FULLY FUNCTIONAL WITH ALL DIVISIONS AND MODULES */}
        <div 
          ref={menuBarRef}
          className="h-7 sm:h-8 px-2 flex items-center justify-between text-xs text-slate-800 bg-[#eceff1] border-b border-[#cfd8dc]"
        >
          {/* Menu items */}
          <div className="flex items-center space-x-0.5 overflow-x-auto no-scrollbar">
            {menuCategories.map((category) => {
              const isOpen = activeMenu === category.id;
              return (
                <div key={category.id} className="relative">
                  <button
                    onClick={() => setActiveMenu(isOpen ? null : category.id)}
                    onMouseEnter={() => {
                      if (activeMenu !== null && activeMenu !== category.id) {
                        setActiveMenu(category.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-0.5 ${
                      isOpen 
                        ? 'bg-[#0078d7] text-white shadow-xs font-semibold' 
                        : 'text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <span>{category.label}</span>
                  </button>

                  {/* Dropdown Menu Window */}
                  {isOpen && (
                    <div 
                      className="absolute left-0 top-full mt-0.5 w-72 sm:w-80 bg-white border border-[#005a9e] shadow-2xl py-1.5 rounded-xs z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-100"
                    >
                      {/* Sub-header showing division area */}
                      <div className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-600 font-bold mb-1">
                        <span className="uppercase tracking-wider text-[#005a9e]">
                          {category.divisionArea}
                        </span>
                        <span className="font-mono text-slate-400">
                          {category.items.length} módulos
                        </span>
                      </div>

                      {/* Module items grouped by division */}
                      <div className="max-h-[75vh] overflow-y-auto divide-y divide-slate-100">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleItemClick(item)}
                              className="w-full text-left px-3 py-2 hover:bg-[#0078d7] hover:text-white group flex items-start gap-2.5 transition text-slate-800"
                            >
                              <div className="p-1 rounded bg-slate-100 group-hover:bg-white/20 text-slate-700 group-hover:text-white shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-[11px] group-hover:text-white tracking-tight truncate">
                                    {item.name}
                                  </span>
                                  {item.shortcut && (
                                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-100 shrink-0">
                                      {item.shortcut}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-500 group-hover:text-blue-100 truncate">
                                    {item.division}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0 bg-slate-200 text-slate-700 group-hover:bg-white/30 group-hover:text-white">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Footer hint */}
                      <div className="px-3 pt-1.5 pb-0.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                        <span>Grupo GAPP Sistemas v10.1</span>
                        <span>[ESC] para fechar</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side: Global Search + Theme Switcher */}
          <div className="flex items-center gap-2 relative">
            {showSearchBox ? (
              <div className="relative">
                <div className="flex items-center bg-white border border-[#005a9e] rounded px-2 py-0.5 shadow-sm">
                  <Search className="w-3 h-3 text-slate-400 mr-1.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Pesquisar módulo, corte ou divisão..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-[11px] focus:outline-none w-48 sm:w-64 text-slate-800"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      setShowSearchBox(false);
                      setSearchQuery('');
                    }} 
                    className="text-slate-400 hover:text-slate-700 ml-1 text-xs"
                    title="Fechar busca"
                  >
                    ✕
                  </button>
                </div>

                {/* Instant Search Results Dropdown */}
                {searchQuery.trim().length > 0 && (
                  <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white border border-[#005a9e] shadow-2xl rounded-xs py-1 z-50 text-xs max-h-80 overflow-y-auto">
                    <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 flex justify-between">
                      <span>MÓDULOS ENCONTRADOS ({searchResults.length})</span>
                      <span className="text-slate-400">Clique para abrir</span>
                    </div>

                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        Nenhum módulo localizado com o termo "{searchQuery}".
                      </div>
                    ) : (
                      searchResults.map((mod) => {
                        const Icon = mod.icon;
                        return (
                          <button
                            key={mod.id}
                            onClick={() => handleItemClick(mod)}
                            className="w-full text-left px-3 py-2 hover:bg-[#0078d7] hover:text-white flex items-start gap-2.5 transition border-b border-slate-100 last:border-b-0 group"
                          >
                            <div className="p-1 rounded bg-slate-100 group-hover:bg-white/20 text-slate-700 group-hover:text-white shrink-0 mt-0.5">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px] group-hover:text-white truncate">
                                  {mod.name}
                                </span>
                                <span className="text-[9px] font-mono px-1 rounded bg-slate-100 group-hover:bg-white/20 text-slate-600 group-hover:text-white">
                                  {mod.code}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 group-hover:text-blue-100 truncate mt-0.5">
                                {mod.description}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 group-hover:text-blue-200">
                                <span>Menu: <strong>{mod.categoryLabel}</strong></span>
                                <span>•</span>
                                <span>Área: {mod.division}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSearchBox(true)}
                className="p-1 hover:bg-slate-200 rounded text-slate-700 transition flex items-center gap-1 text-[11px]"
                title="Pesquisar módulo ou filial"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-slate-600">Localizar Módulo</span>
              </button>
            )}

            {/* Theme Switcher Button on Header */}
            <ThemeSwitcher variant="solidcon-toolbar" />
          </div>
        </div>

        {/* 3. DESKTOP SHORTCUT TOOLBAR (Exact layout from the image) */}
        <div 
          className="h-10 sm:h-11 px-2 flex items-center justify-between overflow-x-auto no-scrollbar border-b border-[#b0bec5]"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'
          }}
        >
          {/* Row of Toolbar Icon Buttons */}
          <div className="flex items-center gap-1">
            
            {/* 1. Novo Lote */}
            <button
              onClick={() => onTabChange('purchases')}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Novo Lote de Compra (Ctrl+N)"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
            </button>

            {/* 2. Planilha Matriz v10.1 */}
            <button
              onClick={() => onTabChange('sheet')}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border shadow-xs transition ${
                activeTab === 'sheet' && !isDesktopView
                  ? 'bg-blue-100 border-blue-600 text-blue-700'
                  : 'bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border-[#9ca3af] text-slate-800'
              }`}
              title="Planilha Matriz da Direção v10.1 (F2)"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-700" />
            </button>

            {/* 3. Salvar / Gravar */}
            <button
              onClick={handleSaveData}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Gravar Alterações / Sincronizar"
            >
              <Save className="w-4 h-4 text-blue-600" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-0.5" />

            {/* 4. Calculadora Rápida */}
            <button
              onClick={onOpenQuickCalc}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Calculadora Rápida de Desossa e Preço da @ (F4)"
            >
              <Calculator className="w-4 h-4 text-amber-600" />
            </button>

            {/* 5. Preços / Cifrão */}
            <button
              onClick={() => onTabChange('yield')}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border shadow-xs transition ${
                activeTab === 'yield' && !isDesktopView
                  ? 'bg-amber-100 border-amber-600 text-amber-800'
                  : 'bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border-[#9ca3af] text-slate-800'
              }`}
              title="Formação de Preço e Custo Limpo por Corte"
            >
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </button>

            {/* 6. Câmaras Frias / Estoque */}
            <button
              onClick={() => onTabChange('inventory')}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border shadow-xs transition ${
                activeTab === 'inventory' && !isDesktopView
                  ? 'bg-blue-100 border-blue-600 text-blue-800'
                  : 'bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border-[#9ca3af] text-slate-800'
              }`}
              title="Estoque em Câmara Fria das 16 Lojas"
            >
              <Warehouse className="w-4 h-4 text-amber-700" />
            </button>

            {/* 7. Cortes e Desossa */}
            <button
              onClick={() => onTabChange('yield')}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Análise Zootécnica de Rendimento e Desossa"
            >
              <Scissors className="w-4 h-4 text-red-600" />
            </button>

            {/* 8. Balança / Pesagem */}
            <button
              onClick={() => onTabChange('yield')}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Balança de Pesagem de Carcaça e Descarte"
            >
              <Scale className="w-4 h-4 text-purple-700" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-0.5" />

            {/* 9. Caminhão / Cargas em Trânsito */}
            <button
              onClick={() => onTabChange('inventory')}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Logística e Peças em Trânsito"
            >
              <Truck className="w-4 h-4 text-blue-600" />
            </button>

            {/* 10. Transferência entre Filiais */}
            <button
              onClick={() => onTabChange('inventory')}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Transferência entre Filiais"
            >
              <ArrowRightLeft className="w-4 h-4 text-cyan-700" />
            </button>

            {/* 11. Descarte Sebo & Osso */}
            <button
              onClick={() => onTabChange('waste')}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border shadow-xs transition ${
                activeTab === 'waste' && !isDesktopView
                  ? 'bg-rose-100 border-rose-600 text-rose-800'
                  : 'bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border-[#9ca3af] text-slate-800'
              }`}
              title="Controle de Descarte (Sebo e Osso para Graxaria)"
            >
              <Bone className="w-4 h-4 text-rose-600" />
            </button>

            {/* 12. DRE / Resultados */}
            <button
              onClick={() => onTabChange('results')}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border shadow-xs transition ${
                activeTab === 'results' && !isDesktopView
                  ? 'bg-indigo-100 border-indigo-600 text-indigo-800'
                  : 'bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border-[#9ca3af] text-slate-800'
              }`}
              title="Apuração de Resultados (DRE, Margem e Markup)"
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </button>

            {/* 13. Impressão */}
            <button
              onClick={onPrint}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Imprimir Relatório Executivo Oficial (Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-slate-700" />
            </button>

            {/* Instalação do Aplicativo Mobile / Desktop */}
            <PWAInstallButton />

            {/* Portal Mobile */}
            {onOpenMobilePortal && (
              <button
                onClick={onOpenMobilePortal}
                className="h-7 sm:h-8 px-2 flex items-center gap-1 rounded bg-gradient-to-b from-amber-50 to-[#fef3c7] hover:from-[#ffffff] hover:to-[#fde68a] border border-amber-600 active:border-amber-700 shadow-xs transition text-amber-950 font-bold text-[11px]"
                title="Abrir Portal Mobile de Lançamento de Estoque por Filial"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Portal Mobile</span>
              </button>
            )}

            {/* Bloqueio / Horários do Portal Mobile (Controle Gestor) */}
            {onOpenPortalControl && (
              <button
                onClick={onOpenPortalControl}
                className="h-7 sm:h-8 px-2 flex items-center gap-1 rounded bg-gradient-to-b from-purple-50 to-[#f3e8ff] hover:from-[#ffffff] hover:to-[#e9d5ff] border border-purple-600 active:border-purple-700 shadow-xs transition text-purple-950 font-bold text-[11px]"
                title="Horários & Bloqueio do Portal Mobile (Controle de Acesso do Gestor)"
              >
                <Clock className="w-3.5 h-3.5 text-purple-700" />
                <span className="hidden sm:inline">Horários Portal</span>
              </button>
            )}

            {/* 13b. Gerar Pedido de Compra Padrão */}
            {onOpenPurchaseOrder && (
              <button
                onClick={onOpenPurchaseOrder}
                className="h-7 sm:h-8 px-2 flex items-center gap-1 rounded bg-gradient-to-b from-blue-50 to-[#dbeafe] hover:from-[#ffffff] hover:to-[#bfdbfe] border border-blue-600 active:border-blue-700 shadow-xs transition text-blue-900 font-bold text-[11px]"
                title="Gerar Pedido de Compra Padrão por loja com valores e quantidades - Atalho: Alt+G"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-blue-700" />
                <span className="hidden sm:inline">Gerar Pedido</span>
              </button>
            )}

            {/* 13c. Cadastro de Fornecedores Frigoríficos */}
            {onOpenSupplierManager && (
              <button
                onClick={onOpenSupplierManager}
                className="h-7 sm:h-8 px-2 flex items-center gap-1 rounded bg-gradient-to-b from-indigo-50 to-[#e0e7ff] hover:from-[#ffffff] hover:to-[#c7d2fe] border border-indigo-600 active:border-indigo-700 shadow-xs transition text-indigo-950 font-bold text-[11px]"
                title="Cadastro e Gestão de Fornecedores e Frigoríficos (Adicionar, Editar, Excluir, Imprimir) - Atalho: Alt+F"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                <span className="hidden sm:inline">Fornecedores</span>
              </button>
            )}

            {/* 14. Exportar XLSX Formatado */}
            {onExportXLSX && (
              <button
                onClick={onExportXLSX}
                className="h-7 sm:h-8 px-2 flex items-center gap-1 rounded bg-gradient-to-b from-emerald-50 to-[#d1fae5] hover:from-[#ffffff] hover:to-[#a7f3d0] border border-emerald-600 active:border-emerald-700 shadow-xs transition text-emerald-900 font-bold text-[11px]"
                title="Exportar Planilha Oficial para Excel (.xlsx com formatação profissional e abas DRE/Rendimento) - Atalho: Alt+X"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">.XLSX</span>
              </button>
            )}

            {/* 15. Exportar CSV */}
            <button
              onClick={onExportCSV}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-blue-500 shadow-xs transition"
              title="Exportar Matriz rápida para CSV (Ctrl+E)"
            >
              <Download className="w-4 h-4 text-emerald-700" />
            </button>

            {/* 16. Atalhos de Teclado */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-amber-500 shadow-xs transition"
                title="Guia de Atalhos Globais de Teclado (F1 ou ?)"
              >
                <Keyboard className="w-4 h-4 text-amber-700" />
              </button>
            )}

            {/* 17. Restaurar v10.1 */}
            <button
              onClick={onReset}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded bg-gradient-to-b from-white to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-red-500 shadow-xs transition"
              title="Restaurar Planilha Oficial da Direção v10.1 (F5)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-0.5" />

            {/* 16. Ver Área de Trabalho Metálica */}
            <button
              onClick={onToggleDesktop}
              className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 border shadow-xs transition ${
                isDesktopView
                  ? 'bg-amber-100 border-amber-600 text-amber-900'
                  : 'bg-white hover:bg-slate-100 border-[#9ca3af] text-slate-700'
              }`}
              title="Minimizar janelas e visualizar Área de Trabalho metálica Grupo GAPP"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">{isDesktopView ? 'Voltar ao Módulo' : 'Área de Trabalho'}</span>
            </button>

          </div>

          {/* Quick status on the right + User Menu */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-700">
            <span className="hidden lg:inline-flex px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              ● {storeCount} Lojas Conectadas
            </span>
            <span className="hidden xl:inline text-slate-600 font-bold">
              Matriz: R$ 376.311,95
            </span>

            {/* Usuário Conectado */}
            {currentUser && (
              <div className="relative ml-1 font-sans" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`h-7 sm:h-8 px-2 rounded flex items-center gap-1.5 border shadow-xs transition cursor-pointer ${
                    currentUser.role === 'DESENVOLVEDOR'
                      ? 'bg-gradient-to-r from-purple-100 to-amber-100 border-purple-400 text-purple-950 font-bold'
                      : 'bg-white hover:bg-slate-100 border-[#9ca3af] text-slate-800 font-bold'
                  }`}
                  title={`Usuário: ${currentUser.name} (${currentUser.role})`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                    currentUser.role === 'DESENVOLVEDOR' ? 'bg-purple-600 text-white' : 'bg-amber-500 text-slate-900'
                  }`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="text-[11px] truncate max-w-[110px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1 w-60 rounded-lg bg-white border border-[#9ca3af] shadow-xl p-2 z-50 text-xs">
                    <div className="p-2 border-b border-slate-200 mb-1">
                      <div className="font-bold text-slate-900 truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">@{currentUser.username} • {currentUser.role}</div>
                      {currentUser.role === 'DESENVOLVEDOR' && (
                        <div className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded mt-1 flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          <span>Acesso 100% Desbloqueado</span>
                        </div>
                      )}
                    </div>

                    {/* Gerenciar Usuários & Acessos - Somente Desenvolvedor e Diretor */}
                    {(currentUser.role === 'DESENVOLVEDOR' || currentUser.role === 'DIRETOR') && onOpenUserManagement && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenUserManagement();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-700 font-medium"
                      >
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>Gerenciar Usuários & Acessos</span>
                      </button>
                    )}

                    {/* Opções de Saída */}
                    {onExitSystem && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onExitSystem();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-50 flex items-center gap-2 text-rose-700 font-bold mt-1"
                      >
                        <Power className="w-3.5 h-3.5 text-rose-600" />
                        <span>Sair e Fechar Navegador</span>
                      </button>
                    )}

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Trocar de Usuário (Logout)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botão Sair do Sistema (Padrão ERP Solidcon) */}
            {(onExitSystem || onLogout) && (
              <button
                type="button"
                onClick={onExitSystem || onLogout}
                className="h-7 sm:h-8 px-2.5 rounded bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-xs flex items-center gap-1.5 border border-red-800 shadow-sm transition cursor-pointer"
                title="Sair do Sistema e Fechar Navegador (Alt+F4)"
              >
                <Power className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>

      </header>

      {/* Classic ERP Dialogs (About, Keyboard Shortcuts, Diagnostics) */}
      <ERPMenuDialogs 
        dialogType={activeDialog} 
        onClose={() => setActiveDialog(null)} 
        storeCount={storeCount}
      />
    </>
  );
};
