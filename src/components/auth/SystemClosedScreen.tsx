import React from 'react';
import { 
  Power, 
  ShieldCheck, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  XSquare, 
  Keyboard,
  Lock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SystemClosedScreenProps {
  onReopenLogin: () => void;
}

export const SystemClosedScreen: React.FC<SystemClosedScreenProps> = ({ onReopenLogin }) => {
  const { isDark, isSolidcon } = useTheme();

  const handleForceClose = () => {
    // 1. Standard window.close
    try {
      window.close();
    } catch {}

    // 2. Open self and close
    try {
      window.open('', '_self', '');
      window.close();
    } catch {}

    // 3. For popups / opener
    try {
      if (window.opener) {
        window.opener = null;
        window.close();
      }
    } catch {}
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
      isSolidcon
        ? 'bg-[#2b3036] text-slate-100'
        : isDark
        ? 'bg-slate-950 text-slate-100'
        : 'bg-slate-100 text-slate-900'
    }`}>
      <div className="w-full max-w-lg">
        {/* Card Principal */}
        <div className={`rounded-3xl border shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden backdrop-blur-xl ${
          isSolidcon
            ? 'bg-[#353c45] border-slate-600 shadow-black/60'
            : isDark
            ? 'bg-slate-900/95 border-slate-800 shadow-black/80'
            : 'bg-white border-slate-200 shadow-slate-300/60'
        }`}>
          {/* Luz de fundo decorativa */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo / Emblema Patrick Pessoa */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 p-2 border-2 border-rose-500/40 shadow-xl flex items-center justify-center">
                <img 
                  src="/brand-logo.svg" 
                  alt="Patrick Pessoa - ERP Apuração do Boi"
                  className="w-full h-full object-contain filter grayscale contrast-125 opacity-80"
                  onError={(e) => {
                    e.currentTarget.src = '/patrick-pessoa-brand.png';
                  }}
                />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-md border border-rose-400 flex items-center gap-1 whitespace-nowrap">
                <Power className="w-2.5 h-2.5" />
                <span>SISTEMA ENCERRADO</span>
              </div>
            </div>
          </div>

          {/* Título & Mensagem */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Saída Concluída
          </h1>
          <p className="text-sm font-medium opacity-80 mb-6 leading-relaxed">
            Sua sessão no <strong>Módulo de Gestão</strong> foi finalizada com total segurança e todos os lançamentos estão preservados.
          </p>

          {/* Card de Status de Segurança */}
          <div className={`p-4 rounded-2xl border mb-6 text-left text-xs space-y-2.5 ${
            isSolidcon
              ? 'bg-slate-800/80 border-slate-700'
              : isDark
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Sessão e credenciais desconectadas com sucesso</span>
            </div>
            <div className="flex items-center gap-2 opacity-75">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Memória temporária e tokens de acesso liberados</span>
            </div>
          </div>

          {/* Botão Principal: Fechar Navegador */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleForceClose}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-[0.98] transition cursor-pointer"
            >
              <XSquare className="w-5 h-5" />
              <span>FECHAR NAVEGADOR AGORA</span>
            </button>

            {/* Dica de Atalho do Teclado */}
            <div className="flex items-center justify-center gap-2 text-[11px] opacity-70 pt-1">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Ou pressione o atalho do navegador:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono font-bold text-[10px] border border-black/10 dark:border-white/10">
                Ctrl + W
              </kbd>
              <span>ou</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono font-bold text-[10px] border border-black/10 dark:border-white/10">
                ⌘ + W
              </kbd>
            </div>
          </div>

          {/* Botão Secundário: Voltar ao Login */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onReopenLogin}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Deseja entrar novamente? Ir para tela de login</span>
            </button>
          </div>

        </div>

        {/* Rodapé */}
        <div className="mt-4 text-center text-xs opacity-60">
          Grupo GAPP • Patrick Pessoa • Gestão Apuração do Boi v10.6
        </div>
      </div>
    </div>
  );
};
