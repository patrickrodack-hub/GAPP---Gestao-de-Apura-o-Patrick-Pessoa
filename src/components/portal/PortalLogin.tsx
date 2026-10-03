import React, { useState } from 'react';
import { Store, PortalLockConfig } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { 
  Building2, 
  User, 
  ArrowRight, 
  Beef, 
  Smartphone, 
  Calendar, 
  Sun, 
  Moon, 
  CheckCircle2,
  Warehouse,
  ChevronDown,
  Lock,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { PortalTheme } from './MobileStockPortal';
import { requestPortalFullscreen } from '../../utils/fullscreen';

interface PortalLoginProps {
  stores: Store[];
  onLogin: (storeId: string, operatorName: string) => void;
  theme: PortalTheme;
  onToggleTheme: () => void;
  portalLockConfig?: PortalLockConfig;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isStandalone?: boolean;
  onOpenInstallModal?: () => void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({
  stores,
  onLogin,
  theme,
  onToggleTheme,
  portalLockConfig,
  isFullscreen,
  onToggleFullscreen,
  isStandalone,
  onOpenInstallModal
}) => {
  // Primordial: A seleção de lojas inicia SEM nenhuma loja selecionada ('')
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  // Verifica permissão e horário do portal
  const portalAccess = StorageService.checkPortalAccess(portalLockConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!portalAccess.isOpen) {
      setError(`O portal está bloqueado no momento: ${portalAccess.message}`);
      return;
    }

    if (!selectedStoreId) {
      setError('Por favor, selecione obrigatoriamente a sua Filial (Loja) no campo destacado em vermelho.');
      return;
    }

    if (!operatorName.trim()) {
      setError('Por favor, digite o seu nome para registrar a contagem.');
      return;
    }

    setError(null);
    requestPortalFullscreen();
    onLogin(selectedStoreId, operatorName.trim());
  };

  const isStoreNotSelected = !selectedStoreId;

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between py-2 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 text-white shadow-md shadow-amber-500/20">
            <Beef className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400 block">
              GRUPO GAPP • APURAÇÃO DO BOI
            </span>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Portal de Estoque Mobile
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Instalar App no Celular (apenas quando não estiver instalado ou standalone) */}
          {!isStandalone && onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Instalar ícone do aplicativo no celular"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Instalar App</span>
            </button>
          )}

          {/* Botão de Tela Cheia (Fullscreen) */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center transition active:scale-95 cursor-pointer"
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir para Tela Cheia (Fullscreen)'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          )}

          {/* Theme Switcher Toggle (Claro / Escuro) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px] font-bold">Escuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        {/* Aviso de Bloqueio de Horário caso o Portal esteja fechado pelo Gestor */}
        {!portalAccess.isOpen && (
          <div className="mb-4 p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 shadow-xl shadow-rose-500/10 space-y-2.5 text-rose-900 dark:text-rose-200 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-600 text-white">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm font-extrabold block text-rose-700 dark:text-rose-300">
                  {portalAccess.title}
                </strong>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{portalAccess.scheduleText}</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300/90 leading-relaxed font-medium bg-white/70 dark:bg-black/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
              {portalAccess.message}
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Liberação exclusiva pela Direção / Gestão</span>
              </span>
              <span className="text-[10px] text-rose-500 dark:text-rose-400 font-mono">
                Aguarde liberação
              </span>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 space-y-6 backdrop-blur-md transition-colors">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-1">
              <Smartphone className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Lançamento de Estoque
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Selecione a sua filial e informe o seu nome para iniciar a contagem semanal de câmara e balcão
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Seleção da Loja - Fundo vermelho chamativo quando não selecionada */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className={`w-3.5 h-3.5 ${isStoreNotSelected ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
                  <span>1. Selecione a Loja / Filial:</span>
                </label>
                {isStoreNotSelected && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                    Obrigatório Escolher
                  </span>
                )}
              </div>
              
              <div className="relative">
                <select
                  value={selectedStoreId}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full appearance-none rounded-xl p-3.5 pr-10 text-sm font-bold transition-all cursor-pointer focus:outline-none ${
                    isStoreNotSelected
                      ? 'bg-red-600 text-white border-2 border-red-500 ring-4 ring-red-400/50 shadow-lg shadow-red-500/30 animate-pulse placeholder-white'
                      : 'bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                >
                  <option value="" disabled className="bg-red-700 text-white font-black py-2">
                    ⚠️ TOQUE AQUI E ESCOLHA SUA LOJA / FILIAL ⚠️
                  </option>
                  {stores.map((store, idx) => (
                    <option 
                      key={store.id} 
                      value={store.id} 
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold py-1.5"
                    >
                      {idx + 1}. {store.name} ({store.city})
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isStoreNotSelected ? 'text-white' : 'text-slate-400'}`} />
              </div>

              {/* Mensagem de alerta vermelha enquanto não escolher a filial */}
              {isStoreNotSelected ? (
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300 text-[11px] font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Selecione a sua filial de origem acima para liberar o lançamento.</span>
                </div>
              ) : selectedStore && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-slate-950/70 border border-emerald-300 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Filial Selecionada: <strong className="text-emerald-800 dark:text-emerald-400 font-extrabold">{selectedStore.name}</strong></span>
                  <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                    <Warehouse className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Câm: {selectedStore.chamberCapacityPieces} pç</span>
                  </span>
                </div>
              )}
            </div>

            {/* 2. Nome do Responsável */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>2. Seu Nome (Responsável pelo Lançamento)</span>
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => {
                  setOperatorName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: Carlos Encarregado / João Açougueiro"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
              />
            </div>

            {/* Status e Horário do Portal */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Data: <strong className="text-slate-900 dark:text-white">{new Date().toLocaleDateString('pt-BR')}</strong></span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                portalAccess.isOpen 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
              }`}>
                {portalAccess.isOpen ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{portalAccess.isOpen ? 'Portal Liberado' : 'Portal Bloqueado'}</span>
              </span>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={!portalAccess.isOpen}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer ${
                portalAccess.isOpen
                  ? isStoreNotSelected
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-red-500/20 animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{portalAccess.isOpen ? (isStoreNotSelected ? 'Selecione a Filial para Acessar' : 'Acessar e Lançar Estoque') : 'Lançamento Bloqueado no Momento'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Store Selector Chips */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Ou toque rápido para selecionar sua filial:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
              {stores.slice(0, 10).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStoreId(s.id);
                    if (error) setError(null);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                    selectedStoreId === s.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs ring-2 ring-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s.name.replace('Loja ', 'L.')}
                </button>
              ))}
            </div>
          </div>

          {/* Link para Instalação no Celular */}
          {!isStandalone && onOpenInstallModal && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instalar aplicativo na tela inicial do celular</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 dark:text-slate-500 py-2">
        <span>Sistema de Apuração do Boi • Matriz Oficial v10.1 (Patrick Pessoa)</span>
      </div>
    </div>
  );
};
