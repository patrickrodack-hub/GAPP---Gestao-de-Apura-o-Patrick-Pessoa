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
  Key,
  LogOut,
  Power,
  ChevronDown,
  ShieldCheck,
  Terminal,
  Cloud
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
  onOpenBackup?: () => void;
  onSaveSheet?: () => void;
  onOpenSheetHistory?: () => void;
  currentUser?: SystemUser | null;
  onOpenUserManagement?: () => void;
  onOpenChangePassword?: () => void;
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
  onOpenBackup,
  onSaveSheet,
  onOpenSheetHistory,
  currentUser,
  onOpenUserManagement,
  onOpenChangePassword,
  onLogout,
  onExitSystem,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[100] relative shadow-sm backdrop-blur transition-colors">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-5 py-2">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5">
          
          {/* 1. Left: Brand & System Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#0c140d] p-1 flex items-center justify-center shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500/40 shrink-0 overflow-hidden">
              <img 
                src="/icon.svg" 
                alt="Gestão Apuração do Boi" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Gestão Apuração do Boi
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 uppercase">
                  v10.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Grupo GAPP Sistemas • {storeCount} Filiais Conectadas
              </p>
            </div>
          </div>

          {/* 2. Center: Compact Consolidated Metrics Pill */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-100/90 dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0 self-start xl:self-center">
            {/* Volume */}
            <div className="pr-2.5 border-r border-slate-300 dark:border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block leading-tight">
                Volume Total
              </span>
              <div className="flex items-baseline gap-1 font-mono font-bold">
                <span className="text-amber-600 dark:text-amber-400">{totalPieces} pçs</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-slate-700 dark:text-slate-200">{Math.round(totalKg).toLocaleString('pt-BR')} kg</span>
              </div>
            </div>

            {/* Total Compra */}
            <div className="pr-2.5 border-r border-slate-300 dark:border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block leading-tight">
                Total Compra
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono block leading-tight">
                {formatCurrencyBRL(totalPurchaseR$)}
              </span>
            </div>

            {/* Preço Médio */}
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block leading-tight">
                Média Quarto (@ R$ 390)
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block leading-tight">
                R$ 26,00 /kg
              </span>
            </div>
          </div>

          {/* 3. Right: Compact Standardized Operational Command Hub */}
          <div className="flex items-center gap-1.5 flex-wrap xl:flex-nowrap justify-end">

            {/* Segment A: Ações Principais de Compra & Desossa */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-1 shrink-0 shadow-xs">
              {onSaveSheet && (
                <button
                  onClick={onSaveSheet}
                  className="h-7.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                  title="Salvar versão oficial atual da planilha no histórico - Atalho: Ctrl+S"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                  <span className="text-[9px] bg-emerald-700/80 px-1 py-0.2 rounded font-mono hidden sm:inline">Ctrl+S</span>
                </button>
              )}

              {onOpenPurchaseOrder && (
                <button
                  onClick={onOpenPurchaseOrder}
                  className="h-7.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                  title="Gerar Pedido de Compra Padrão por loja com valores e quantidades - Atalho: Alt+G"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Pedido</span>
                  <span className="text-[9px] bg-blue-700/80 px-1 py-0.2 rounded font-mono hidden sm:inline">Alt+G</span>
                </button>
              )}

              {onOpenSupplierManager && (
                <button
                  onClick={onOpenSupplierManager}
                  className="h-7.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                  title="Cadastro e Gestão de Frigoríficos e Fornecedores - Atalho: Alt+F"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Fornecedores</span>
                </button>
              )}

              <button
                onClick={onOpenQuickCalc}
                className="h-7.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                title="Calculadora Rápida de Desossa e Preço de Equilíbrio (F4)"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Desossa</span>
              </button>
            </div>

            {/* Segment B: Nuvem Firestore & Hub Mobile */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-1 shrink-0 shadow-xs">
              {onOpenBackup && (
                <button
                  onClick={onOpenBackup}
                  className="h-7.5 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                  title="Central de Backup Online Firestore & Agendamento Automático - Atalho: Alt+9"
                >
                  <Cloud className="w-3.5 h-3.5 text-sky-200" />
                  <span>Backup</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              )}

              {/* Hub Mobile Interativo (Portal + Horários) */}
              <div className="relative" ref={mobileMenuRef}>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="h-7.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Acessar Portal Mobile de Filiais e Horários de Bloqueio"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden lg:inline">Mobile</span>
                  <ChevronDown className="w-3 h-3 text-amber-600" />
                </button>

                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-[9999] text-xs animate-in fade-in zoom-in-95">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 mb-1">
                      Módulos Mobile das Filiais
                    </div>

                    {onOpenMobilePortal && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenMobilePortal();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/15 text-slate-800 dark:text-slate-200 flex items-center gap-2 font-semibold transition"
                      >
                        <Smartphone className="w-4 h-4 text-amber-600" />
                        <div>
                          <div>Portal Mobile (Filiais)</div>
                          <div className="text-[10px] text-slate-400 font-normal">Lançamento de estoque por loja</div>
                        </div>
                      </button>
                    )}

                    {onOpenPortalControl && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenPortalControl();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-purple-500/15 text-slate-800 dark:text-slate-200 flex items-center gap-2 font-semibold transition mt-0.5"
                      >
                        <Clock className="w-4 h-4 text-purple-600" />
                        <div>
                          <div>Horários & Bloqueio</div>
                          <div className="text-[10px] text-slate-400 font-normal">Controle de horários do gestor</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Segment C: Exportação & Relatórios Segmentados */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-0.5 shrink-0 shadow-xs">
              {onExportXLSX && (
                <button
                  onClick={onExportXLSX}
                  className="h-7.5 px-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-800 hover:text-white dark:text-emerald-300 dark:hover:text-white border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Exportar Planilha Oficial para Excel (.xlsx estruturado) - Atalho: Alt+X"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.XLSX</span>
                </button>
              )}

              <button
                onClick={onExportCSV}
                className="h-7.5 px-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                title="Exportar Matriz rápida para CSV (Ctrl+E)"
              >
                CSV
              </button>

              <button
                onClick={onPrint}
                className="h-7.5 w-7.5 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                title="Imprimir Relatório Executivo Oficial (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </button>
            </div>

            {/* Segment D: Utilidades & Sistema */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-0.5 shrink-0 shadow-xs">
              {onOpenShortcuts && (
                <button
                  onClick={onOpenShortcuts}
                  className="h-7.5 w-7.5 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  title="Atalhos Globais de Teclado (F1 ou ?)"
                >
                  <span className="font-mono text-xs">⌨️</span>
                </button>
              )}

              <button
                onClick={onReset}
                className="h-7.5 w-7.5 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition cursor-pointer"
                title="Restaurar Planilha Oficial da Direção v10.4 (F5)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <PWAInstallButton />

              {/* Seletor de Tema Compacto */}
              <ThemeSwitcher variant="compact" />
            </div>

            {/* Segment E: Usuário & Sessão */}
            {currentUser && (
              <div className="relative shrink-0 z-[100]" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`h-8.5 px-2.5 rounded-xl border flex items-center gap-2 transition cursor-pointer shadow-xs ${
                    currentUser.role === 'DESENVOLVEDOR'
                      ? 'bg-gradient-to-r from-purple-500/15 to-amber-500/15 border-purple-500/40 text-slate-900 dark:text-white hover:border-purple-500'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={`Usuário conectado: ${currentUser.name} (${currentUser.role})`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                    currentUser.role === 'DESENVOLVEDOR'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-amber-500 text-slate-950'
                  }`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-left hidden md:block">
                    <span className="block text-[11px] font-bold leading-none truncate max-w-[100px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className={`block text-[8px] font-black uppercase tracking-wider ${
                      currentUser.role === 'DESENVOLVEDOR' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
                    }`}>
                      {currentUser.role === 'DESENVOLVEDOR' ? 'DEV' : currentUser.role}
                    </span>
                  </div>

                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu do Usuário */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-[9999] text-xs animate-in fade-in slide-in-from-top-2">
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

                    {/* Botão Alterar Senha - Para qualquer usuário logado */}
                    {onOpenChangePassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePassword();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 transition font-semibold cursor-pointer border border-transparent hover:border-amber-200 dark:hover:border-amber-800/60"
                      >
                        <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Alterar Minha Senha</span>
                      </button>
                    )}

                    {/* Botão Gerenciar Usuários - Somente Desenvolvedor e Diretor */}
                    {(currentUser.role === 'DESENVOLVEDOR' || currentUser.role === 'DIRETOR') && onOpenUserManagement && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenUserManagement();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition font-semibold cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition font-bold mt-1 cursor-pointer"
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
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Trocar de Usuário (Logout)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botão Rápido de Sair */}
            {(onExitSystem || onLogout) && (
              <button
                type="button"
                onClick={onExitSystem || onLogout}
                className="h-8.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-700 hover:text-white dark:text-rose-400 dark:hover:text-white border border-rose-200 dark:border-rose-900/60 text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer shrink-0"
                title="Sair do Sistema e Fechar Navegador"
              >
                <Power className="w-3.5 h-3.5 text-rose-600 hover:text-white dark:text-rose-400" />
                <span className="hidden xl:inline">Sair</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};


