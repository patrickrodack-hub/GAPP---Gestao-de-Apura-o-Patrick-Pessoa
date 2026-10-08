import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, RotateCcw } from 'lucide-react';

interface ResetSystemConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetSystemConfirmModal: React.FC<ResetSystemConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmationInput.trim().toUpperCase() !== 'RESTAURAR') {
      setErrorMsg('Digite exatamente "RESTAURAR" em maiúsculas para confirmar.');
      return;
    }
    setErrorMsg('');
    setConfirmationInput('');
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    setConfirmationInput('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border-b border-rose-500/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Restauração de Fábrica
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                Ação Crítica
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Redefinição dos parâmetros para a base oficial inicial v10.7
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>Atenção: Esta ação é irreversível!</span>
            </div>
            <p>
              Todos os lançamentos atuais de estoque das 16 lojas, pedidos e alterações serão substituídos pelos dados iniciais da matriz oficial.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Para prosseguir, digite <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">RESTAURAR</span> abaixo:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => {
                setConfirmationInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Digite RESTAURAR"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              autoFocus
            />
            {errorMsg && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{errorMsg}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmationInput.trim().toUpperCase() !== 'RESTAURAR'}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirmar Restauração</span>
          </button>
        </div>
      </div>
    </div>
  );
};
