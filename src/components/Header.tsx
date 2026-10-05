import React, { useState, useRef, useEffect } from 'react';
import { 
  Beef, 
  RotateCcw, 
  Download, 
  Printer, 
  Calculator,
  ShoppingCart,
  Building2,
  Smartphone,
  Save,
  History,
  Clock,
  User,
  Users,
  LogOut,
  Power,
  ChevronDown,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { formatCurrencyBRL } from '../services/calculationService';
import { ThemeSwitcher } from './common/ThemeSwitcher';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { SystemUser } from '../types/erp';

interface HeaderProps {
  totalPurchaseR$: number;
  totalPieces: number;
  totalKg: number;
  storeCount: number;
  onReset: () => void;
  onExportCSV: () => void;
  onExportXLSX?: () => void;
  onOpenQuickCalc: () => void;
  onPrint: () => void;
  onOpenShortcuts?: () => void;
  onOpenPurchaseOrder?: () => void;
  onOpenSupplierManager?: () => void;
  onOpenMobilePortal?: () => void;
  onOpenPortalControl?: () => void;
  onSaveSheet?: () => void;
  onOpenSheetHistory?: () => void;
  currentUser?: SystemUser | null;
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
  onExitSystem?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalPurchaseR$,
  totalPieces,
  totalKg,
  storeCount,
  onReset,
  onExportCSV,
  onExportXLSX,
  onOpenQuickCalc,
  onPrint,
  onOpenShortcuts,
  onOpenPurchaseOrder,
  onOpenSupplierManager,
  onOpenMobilePortal,
  onOpenPortalControl,
  onSaveSheet,
  onOpenSheetHistory,
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
  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur transition-colors">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0c140d] p-1 flex items-center justify-center shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40 shrink-0 overflow-hidden">
              <img 
                src="/icon.svg" 
                alt="Patrick Pessoa - Gestão Integral de Compra" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Grupo GAPP Sistemas • Apuração do Boi por Patrick Pessoa
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40">
                  GRUPO GAPP
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  v10.1
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão Integral de Compra, Desossa, Rendimento, Estoque e Margens • {storeCount} Filiais Ativas
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-100 dark:bg-slate-950/80 p-2 sm:px-4 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="text-left pr-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block tracking-wider">
                Volume Consolidado
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {totalPieces.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">peças</span>
                <span className="text-xs text-slate-300 dark:text-slate-600">|</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                  {Math.round(totalKg).toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">kg</span>
              </div>
            </div>

            <div className="text-left pr-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block tracking-wider">
                Valor Total Compra
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrencyBRL(totalPurchaseR$)}
              </span>
            </div>

            <div className="text-left">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block tracking-wider">
                Preço Médio Quarto
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                R$ 26,00 /kg <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(@ R$ 390)</span>
              </span>
            </div>
          </div>

          {/* Action buttons + Theme Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Theme Switcher Button */}
            <ThemeSwitcher variant="full" />

            <PWAInstallButton />

            {onOpenMobilePortal && (
              <button
                onClick={onOpenMobilePortal}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-sm hover:shadow"
                title="Abrir Portal Mobile de Lançamento de Estoque por Filial"
              >
                <Smartphone className="w-4 h-4" />
                <span>Portal Mobile</span>
              </button>
            )}

            {onOpenPortalControl && (
              <button
                onClick={onOpenPortalControl}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm hover:shadow"
                title="Horários & Bloqueio do Portal Mobile (Controle de Acesso do Gestor)"
              >
                <Clock className="w-4 h-4" />
                <span>Horários Portal</span>
              </button>
            )}

            {onSaveSheet && (
              <button
                onClick={onSaveSheet}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm hover:shadow active:scale-95"
                title="Salvar versão oficial atual da planilha no histórico com data e hora exatas - Atalho: Ctrl+S"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Planilha</span>
                <span className="text-[9px] bg-emerald-700/80 px-1 rounded ml-0.5 font-mono">Ctrl+S</span>
              </button>
            )}

            {onOpenPurchaseOrder && (
              <button
                onClick={onOpenPurchaseOrder}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm hover:shadow"
                title="Gerar Pedido de Compra Padrão por loja com valores e quantidades - Atalho: Alt+G"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Gerar Pedido</span>
                <span className="text-[9px] bg-blue-700/80 px-1 rounded ml-0.5 font-mono">Alt+G</span>
              </button>
            )}

            {onOpenSupplierManager && (
              <button
                onClick={onOpenSupplierManager}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm hover:shadow"
                title="Cadastro e Gestão de Frigoríficos e Fornecedores de Gado (Adicionar, Editar, Excluir, Imprimir) - Atalho: Alt+F"
              >
                <Building2 className="w-4 h-4" />
                <span>Fornecedores</span>
                <span className="text-[9px] bg-indigo-700/80 px-1 rounded ml-0.5 font-mono">Alt+F</span>
              </button>
            )}

            <button
              onClick={onOpenQuickCalc}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm hover:shadow"
              title="Abrir Calculadora de Desossa e Preço de Equilíbrio"
            >
              <Calculator className="w-4 h-4" />
              <span>Simular Desossa</span>
            </button>

            {onExportXLSX && (
              <button
                onClick={onExportXLSX}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm hover:shadow"
                title="Exportar Planilha Oficial Completa para Excel (.xlsx com formatação profissional e abas DRE/Rendimento) - Atalho: Alt+X"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar .XLSX</span>
                <span className="text-[9px] bg-emerald-700/80 px-1 rounded ml-0.5 font-mono">Alt+X</span>
              </button>
            )}

            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
              title="Exportar dados rápidos para CSV"
            >
              <span>CSV</span>
            </button>

            <button
              onClick={onPrint}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
              title="Imprimir Relatório de Apuração (Alt+P)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Imprimir</span>
            </button>

            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center gap-1 transition"
                title="Guia de Atalhos Globais de Teclado (F1 ou ?)"
              >
                <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">⌨️</span>
                <span className="hidden sm:inline">Atalhos</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-300 dark:border-slate-700/60 text-xs font-medium flex items-center gap-1 transition"
              title="Restaurar valores padrão da Planilha v10.1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>

            {/* Menu de Usuário Conectado */}
            {currentUser && (
              <div className="relative ml-1" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
                    currentUser.role === 'DESENVOLVEDOR'
                      ? 'bg-gradient-to-r from-purple-500/15 to-amber-500/15 border-purple-500/40 text-slate-900 dark:text-white hover:border-purple-500'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={`Usuário conectado: ${currentUser.name} (${currentUser.role})`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                    currentUser.role === 'DESENVOLVEDOR'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-amber-500 text-slate-950'
                  }`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-left hidden md:block">
                    <span className="block text-xs font-bold leading-tight">
                      {currentUser.name}
                    </span>
                    <span className={`block text-[9px] font-extrabold uppercase tracking-wider ${
                      currentUser.role === 'DESENVOLVEDOR' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {currentUser.role === 'DESENVOLVEDOR' ? 'DESENVOLVEDOR' : currentUser.role}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white block truncate">
                            {currentUser.name}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            @{currentUser.username} • {currentUser.roleTitle || currentUser.role}
                          </span>
                        </div>
                      </div>

                      {currentUser.role === 'DESENVOLVEDOR' && (
                        <div className="mt-2 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          <span>100% de Acesso Desbloqueado</span>
                        </div>
                      )}
                    </div>

                    {/* Botão Gerenciar Usuários - Somente Desenvolvedor e Diretor */}
                    {(currentUser.role === 'DESENVOLVEDOR' || currentUser.role === 'DIRETOR') && onOpenUserManagement && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenUserManagement();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition font-semibold"
                      >
                        <Users className="w-4 h-4 text-purple-500" />
                        <span>Gerenciar Usuários & Acessos</span>
                      </button>
                    )}

                    {/* Opções de Saída e Troca de Usuário */}
                    {onExitSystem && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onExitSystem();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition font-bold mt-1"
                      >
                        <Power className="w-4 h-4 text-rose-500" />
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
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Trocar de Usuário (Logout)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botão Direto de Sair do Sistema */}
            {(onExitSystem || onLogout) && (
              <button
                type="button"
                onClick={onExitSystem || onLogout}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-700 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-200 dark:border-rose-900/60 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer group"
                title="Sair do Sistema e Fechar Navegador"
              >
                <Power className="w-3.5 h-3.5 text-rose-600 group-hover:text-white dark:text-rose-400 transition" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};


