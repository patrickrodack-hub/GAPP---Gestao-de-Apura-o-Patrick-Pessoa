import React from 'react';
import { 
  LogOut, 
  Power, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink, 
  UserCheck 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ExitSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExitAndCloseBrowser: () => void;
  onLogoutOnly: () => void;
  userName?: string;
}

export const ExitSystemModal: React.FC<ExitSystemModalProps> = ({
  isOpen,
  onClose,
  onExitAndCloseBrowser,
  onLogoutOnly,
  userName,
}) => {
  const { isDark, isSolidcon } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 ${
          isSolidcon
            ? 'bg-[#353c45] border-slate-600 text-slate-100'
            : isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho do Modal */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isSolidcon 
            ? 'bg-gradient-to-r from-red-900/60 to-slate-800 border-slate-700' 
            : 'bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">
                Sair do Sistema
              </h2>
              <span className="text-[11px] opacity-75 font-mono block">
                Apuração do Boi • Módulo de Gestão
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">
                {userName ? `Olá, ${userName}!` : 'Atenção'}
              </p>
              <p className="text-xs opacity-85 leading-relaxed">
                Você escolheu sair do sistema. Deseja fechar a janela do navegador e encerrar sua sessão de trabalho?
              </p>
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
            isSolidcon
              ? 'bg-slate-800/80 border-slate-700 text-slate-300'
              : isDark
              ? 'bg-slate-950/60 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Seus lançamentos e dados de compras estão seguros.</span>
            </div>
            <p>
              Ao confirmar, sua sessão será finalizada imediatamente e o navegador tentará fechar esta aba.
            </p>
          </div>
        </div>

        {/* Rodapé com Ações Claras */}
        <div className={`px-5 py-4 border-t flex flex-col sm:flex-row items-center justify-end gap-2 ${
          isSolidcon
            ? 'bg-slate-800/50 border-slate-700'
            : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onLogoutOnly}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Apenas deslogar e retornar à tela de login"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Trocar de Usuário</span>
          </button>

          <button
            type="button"
            onClick={onExitAndCloseBrowser}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Sair e Fechar Navegador</span>
          </button>
        </div>

      </div>
    </div>
  );
};
