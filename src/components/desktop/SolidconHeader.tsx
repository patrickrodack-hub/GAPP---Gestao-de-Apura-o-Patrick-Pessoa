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
  Terminal,
  Cloud,
  Key
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
  onOpenBackup?: () => void;
  onSaveSheet?: () => void;
  currentUser?: SystemUser | null;
  onOpenUserManagement?: () => void;
  onOpenChangePassword?: () => void;
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
  onOpenBackup,
  onSaveSheet,
  currentUser,
  onOpenUserManagement,
  onOpenChangePassword,
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
        case 'backup':
          if (onOpenBackup) onOpenBackup();
          else onTabChange('backup');
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
      case 'sheet': return 'Planilha de Compra da Direção da Empresa v10.3 - Matriz 16 Filiais';
      case 'dashboard': return 'Painel Executivo Geral - Apuração do Boi';
      case 'yield': return 'Análise Técnica de Rendimento, Desossa e Cortes';
      case 'results': return 'DRE Gerencial, Margens de Compra e Venda (Markup)';
      case 'inventory': return 'Controle de Estoque: Câmaras Frias, Desossa e Trânsito';
      case 'purchases': return 'Gestão de Compras de Gado e Lotes de Frigoríficos';
      case 'waste': return 'Controle de Subprodutos & Descarte (Sebo e Osso)';
      case 'parameters': return 'Módulo 1: Cadastro de Informações e Parâmetros (7 Etapas)';
      case 'backup': return 'Central de Backup Online & Agendamento Automático (Nuvem Firestore)';
      default: return 'Apuração do Boi';
    }
  };

  return (
    <>
      <header className="w-full select-none font-sans z-[100] relative shadow-md">
        
        {/* Toast de Salvar */}
        {saveToast && (
          <div className="fixed top-12 right-5 z-50 bg-emerald-600 text-white px-4 py-2 rounded shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-400 animate-bounce">
            <span>✓ Todas as alterações foram sincronizadas e salvas na base local com sucesso!</span>
          </div>
        )}

        {/* 1. CLASSIC DESKTOP MENU BAR - FULLY FUNCTIONAL WITH ALL DIVISIONS AND MODULES */}
        <div 
          ref={menuBarRef}
          className="h-7 sm:h-8 px-2 flex items-center justify-between text-xs text-slate-800 bg-[#eceff1] border-b border-[#cfd8dc] relative z-[120]"
        >
          {/* Menu items */}
          <div className="flex items-center space-x-0.5">
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
                      className="absolute left-0 top-full mt-0.5 w-72 sm:w-84 bg-white border border-[#005a9e] shadow-[0_15px_35px_rgba(0,0,0,0.35)] py-1.5 rounded-xs z-[9999] text-xs font-sans animate-in fade-in zoom-in-95 duration-75"
                      style={{ minWidth: '18rem' }}
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
                              className="w-full text-left px-3 py-2 hover:bg-[#0078d7] hover:text-white group flex items-start gap-2.5 transition text-slate-800 cursor-pointer"
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
                        <span>Grupo GAPP Sistemas v10.3</span>
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
                    className="text-slate-400 hover:text-slate-700 ml-1 text-xs cursor-pointer"
                    title="Fechar busca"
                  >
                    ✕
                  </button>
                </div>

                {/* Instant Search Results Dropdown */}
                {searchQuery.trim().length > 0 && (
                  <div className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white border border-[#005a9e] shadow-[0_15px_35px_rgba(0,0,0,0.35)] rounded-xs py-1 z-[9999] text-xs max-h-80 overflow-y-auto">
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
                            className="w-full text-left px-3 py-2 hover:bg-[#0078d7] hover:text-white flex items-start gap-2.5 transition border-b border-slate-100 last:border-b-0 group cursor-pointer"
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
                className="p-1 hover:bg-slate-200 rounded text-slate-700 transition flex items-center gap-1 text-[11px] cursor-pointer"
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

        {/* 3. DESKTOP SHORTCUT TOOLBAR (Interactive Standardized Menu & Tool Boxes) */}
        <div 
          className="h-10 sm:h-11 px-2 flex items-center justify-between border-b border-[#b0bec5] relative z-[100]"
          style={{
            background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'
          }}
        >
          {/* Segmented Standardized Button Boxes */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            
            {/* Box 1: Matriz & Gravação */}
            <div className="bg-[#d5dce4] p-0.5 rounded-md border border-[#b8c4d0] shadow-inner flex items-center gap-0.5 shrink-0">
              {/* Novo Lote */}
              <button
                onClick={() => onTabChange('purchases')}
                className={`h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 ${
                  activeTab === 'purchases' && !isDesktopView
                    ? 'bg-[#0078d7] text-white border-[#005a9e] shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800'
                }`}
                title="Novo Lote de Compra (Ctrl+N)"
              >
                <Plus className={`w-3.5 h-3.5 ${activeTab === 'purchases' && !isDesktopView ? 'text-white' : 'text-emerald-600'}`} />
                <span className="hidden xl:inline">Novo Lote</span>
              </button>

              {/* Planilha Matriz v10.3 */}
              <button
                onClick={() => onTabChange('sheet')}
                className={`h-7.5 px-2.5 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 ${
                  activeTab === 'sheet' && !isDesktopView
                    ? 'bg-[#0078d7] text-white border-[#005a9e] shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800'
                }`}
                title="Planilha Matriz da Direção v10.3 (F2)"
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'sheet' && !isDesktopView ? 'text-white' : 'text-blue-700'}`} />
                <span>Matriz v10.3</span>
              </button>

              {/* Salvar / Gravar */}
              <button
                onClick={handleSaveData}
                className="h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                title="Gravar Alterações / Sincronizar (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden lg:inline">Salvar</span>
              </button>
            </div>

            {/* Box 2: Apuração & Cálculos */}
            <div className="bg-[#d5dce4] p-0.5 rounded-md border border-[#b8c4d0] shadow-inner flex items-center gap-0.5 shrink-0">
              {/* Calculadora Rápida */}
              <button
                onClick={onOpenQuickCalc}
                className="h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                title="Calculadora Rápida de Desossa e Preço da @ (F4)"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xl:inline">Calculadora @</span>
              </button>

              {/* Rendimento & Preço */}
              <button
                onClick={() => onTabChange('yield')}
                className={`h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 ${
                  activeTab === 'yield' && !isDesktopView
                    ? 'bg-[#0078d7] text-white border-[#005a9e] shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800'
                }`}
                title="Rendimento de Desossa e Formação de Preço Limpo"
              >
                <Scissors className={`w-3.5 h-3.5 ${activeTab === 'yield' && !isDesktopView ? 'text-white' : 'text-red-600'}`} />
                <span className="hidden lg:inline">Desossa</span>
              </button>

              {/* Câmaras Frias / Estoque */}
              <button
                onClick={() => onTabChange('inventory')}
                className={`h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 ${
                  activeTab === 'inventory' && !isDesktopView
                    ? 'bg-[#0078d7] text-white border-[#005a9e] shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800'
                }`}
                title="Estoque em Câmara Fria das 16 Lojas"
              >
                <Warehouse className={`w-3.5 h-3.5 ${activeTab === 'inventory' && !isDesktopView ? 'text-white' : 'text-cyan-700'}`} />
                <span className="hidden lg:inline">Estoque</span>
              </button>

              {/* DRE / Resultados */}
              <button
                onClick={() => onTabChange('results')}
                className={`h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 ${
                  activeTab === 'results' && !isDesktopView
                    ? 'bg-[#0078d7] text-white border-[#005a9e] shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800'
                }`}
                title="Apuração de Resultados (DRE, Margem e Markup)"
              >
                <TrendingUp className={`w-3.5 h-3.5 ${activeTab === 'results' && !isDesktopView ? 'text-white' : 'text-indigo-600'}`} />
                <span className="hidden lg:inline">DRE</span>
              </button>

              {/* Descarte Sebo & Osso */}
              <button
                onClick={() => onTabChange('waste')}
                className={`h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 ${
                  activeTab === 'waste' && !isDesktopView
                    ? 'bg-[#0078d7] text-white border-[#005a9e] shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800'
                }`}
                title="Controle de Descarte (Sebo e Osso para Graxaria)"
              >
                <Bone className={`w-3.5 h-3.5 ${activeTab === 'waste' && !isDesktopView ? 'text-white' : 'text-rose-600'}`} />
                <span className="hidden xl:inline">Descarte</span>
              </button>
            </div>

            {/* Box 3: Ações Operacionais & Conexões */}
            <div className="bg-[#d5dce4] p-0.5 rounded-md border border-[#b8c4d0] shadow-inner flex items-center gap-0.5 shrink-0">
              {/* Gerar Pedido de Compra */}
              {onOpenPurchaseOrder && (
                <button
                  onClick={onOpenPurchaseOrder}
                  className="h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                  title="Gerar Pedido de Compra Padrão por loja com valores e quantidades - Atalho: Alt+G"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-700" />
                  <span className="hidden sm:inline">Pedido</span>
                </button>
              )}

              {/* Fornecedores */}
              {onOpenSupplierManager && (
                <button
                  onClick={onOpenSupplierManager}
                  className="h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                  title="Cadastro e Gestão de Fornecedores e Frigoríficos - Atalho: Alt+F"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="hidden sm:inline">Fornecedores</span>
                </button>
              )}

              {/* Central de Backup Online */}
              <button
                onClick={() => onOpenBackup ? onOpenBackup() : onTabChange('backup')}
                className={`h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 ${
                  activeTab === 'backup' && !isDesktopView
                    ? 'bg-[#0078d7] text-white border-[#005a9e] shadow-sm'
                    : 'bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800'
                }`}
                title="Central de Backup Online Firestore & Agendamento (Alt+9)"
              >
                <Cloud className={`w-3.5 h-3.5 ${activeTab === 'backup' && !isDesktopView ? 'text-white' : 'text-sky-600'}`} />
                <span className="hidden sm:inline">Backup Nuvem</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* Portal Mobile */}
              {onOpenMobilePortal && (
                <button
                  onClick={onOpenMobilePortal}
                  className="h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                  title="Abrir Portal Mobile de Lançamento de Estoque por Filial"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden md:inline">Portal Mobile</span>
                </button>
              )}

              {/* Horários Portal */}
              {onOpenPortalControl && (
                <button
                  onClick={onOpenPortalControl}
                  className="h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                  title="Horários & Bloqueio do Portal Mobile (Controle de Acesso do Gestor)"
                >
                  <Clock className="w-3.5 h-3.5 text-purple-700" />
                  <span className="hidden xl:inline">Horários</span>
                </button>
              )}
            </div>

            {/* Box 4: Exportação, Utilidades & Sistema */}
            <div className="bg-[#d5dce4] p-0.5 rounded-md border border-[#b8c4d0] shadow-inner flex items-center gap-0.5 shrink-0">
              {/* Exportar XLSX */}
              {onExportXLSX && (
                <button
                  onClick={onExportXLSX}
                  className="h-7.5 px-2 flex items-center gap-1.5 rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                  title="Exportar Planilha Oficial para Excel (.xlsx com formatação profissional e abas DRE/Rendimento) - Atalho: Alt+X"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">.XLSX</span>
                </button>
              )}

              {/* Exportar CSV */}
              <button
                onClick={onExportCSV}
                className="h-7.5 w-7.5 flex items-center justify-center rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                title="Exportar Matriz rápida para CSV (Ctrl+E)"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" />
              </button>

              {/* Imprimir */}
              <button
                onClick={onPrint}
                className="h-7.5 w-7.5 flex items-center justify-center rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                title="Imprimir Relatório Executivo Oficial (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5 text-slate-700" />
              </button>

              {/* Atalhos de Teclado */}
              {onOpenShortcuts && (
                <button
                  onClick={onOpenShortcuts}
                  className="h-7.5 w-7.5 flex items-center justify-center rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                  title="Guia de Atalhos Globais de Teclado (F1 ou ?)"
                >
                  <Keyboard className="w-3.5 h-3.5 text-amber-700" />
                </button>
              )}

              {/* Restaurar v10.3 */}
              <button
                onClick={onReset}
                className="h-7.5 w-7.5 flex items-center justify-center rounded text-[11px] font-semibold transition cursor-pointer border shadow-xs active:scale-95 bg-gradient-to-b from-white to-[#edf2f7] hover:from-white hover:to-[#e2e8f0] border-[#9ca3af] text-slate-800"
                title="Restaurar Planilha Oficial da Direção v10.3 (F5)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              </button>

              {/* Instalação do Aplicativo Mobile / Desktop */}
              <PWAInstallButton />

              {/* Ver Área de Trabalho Metálica */}
              <button
                onClick={onToggleDesktop}
                className={`h-7.5 px-2 rounded text-[11px] font-bold flex items-center gap-1.5 border shadow-xs transition cursor-pointer active:scale-95 ${
                  isDesktopView
                    ? 'bg-amber-100 border-amber-600 text-amber-900'
                    : 'bg-white hover:bg-slate-100 border-[#9ca3af] text-slate-700'
                }`}
                title="Minimizar janelas e visualizar Área de Trabalho metálica Grupo GAPP"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">{isDesktopView ? 'Voltar' : 'Área de Trabalho'}</span>
              </button>
            </div>

          </div>

          {/* Quick status on the right + User Menu */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-700 shrink-0 ml-2">
            <span className="hidden lg:inline-flex px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              ● {storeCount} Lojas
            </span>

            {/* Usuário Conectado */}
            {currentUser && (
              <div className="relative font-sans z-[200]" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`h-7.5 px-2 rounded flex items-center gap-1.5 border shadow-xs transition cursor-pointer ${
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
                  <div className="absolute right-0 mt-1 w-60 rounded-lg bg-white border border-[#9ca3af] shadow-[0_15px_35px_rgba(0,0,0,0.35)] p-2 z-[9999] text-xs">
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

                    {/* Alterar Senha - Para qualquer usuário logado */}
                    {onOpenChangePassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 flex items-center gap-2 text-amber-900 font-medium"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                        <span>Alterar Minha Senha</span>
                      </button>
                    )}

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
