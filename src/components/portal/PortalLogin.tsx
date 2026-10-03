import React, { useState } from 'react';
import { Store } from '../../types/erp';
import { 
  Building2, 
  User, 
  ArrowRight, 
  Beef, 
  Smartphone, 
  Calendar, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  Warehouse,
  ChevronDown
} from 'lucide-react';
import { PortalTheme } from './MobileStockPortal';

interface PortalLoginProps {
  stores: Store[];
  onLogin: (storeId: string, operatorName: string) => void;
  onSwitchToAdmin: () => void;
  theme: PortalTheme;
  onToggleTheme: () => void;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({
  stores,
  onLogin,
  onSwitchToAdmin,
  theme,
  onToggleTheme
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '1');
  const [operatorName, setOperatorName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorName.trim()) {
      setError('Por favor, digite o seu nome para registrar a contagem.');
      return;
    }
    setError(null);
    onLogin(selectedStoreId, operatorName.trim());
  };

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

          {/* Switch to Admin ERP */}
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition font-medium shadow-xs"
          >
            Modo Gestor
          </button>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
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
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* 1. Seleção da Loja */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>1. Selecione a Loja / Filial</span>
              </label>
              
              <div className="relative">
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 rounded-xl p-3 pr-9 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                >
                  {stores.map((store, idx) => (
                    <option key={store.id} value={store.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">
                      {idx + 1}. {store.name} ({store.city})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {selectedStore && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-slate-950/70 border border-amber-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Encarregado: <strong className="text-slate-900 dark:text-slate-200">{selectedStore.manager}</strong></span>
                  <span className="flex items-center gap-1">
                    <Warehouse className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Câmara: <strong className="text-amber-700 dark:text-amber-400">{selectedStore.chamberCapacityPieces} pç</strong></span>
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
                placeholder="Ex: Carlos Encarregado / João Silva"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 rounded-xl p-3 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
              />
            </div>

            {/* Status e Data */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Data: <strong className="text-slate-900 dark:text-white">{new Date().toLocaleDateString('pt-BR')}</strong></span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Planilha Matriz Ativa</span>
              </span>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
            >
              <span>Acessar e Lançar Estoque</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Store Selector Chips */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Toque rápido para trocar de filial:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
              {stores.slice(0, 10).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStoreId(s.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                    selectedStoreId === s.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s.name.replace('Loja ', 'L.')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-slate-500 dark:text-slate-500 py-2">
        <span>Sistema de Apuração do Boi • Matriz Oficial v10.1 (Patrick Pessoa)</span>
      </div>
    </div>
  );
};
