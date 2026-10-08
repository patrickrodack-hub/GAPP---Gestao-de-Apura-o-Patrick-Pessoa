import React, { useState } from 'react';
import { 
  Eraser, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Sparkles,
  Store as StoreIcon,
  HelpCircle
} from 'lucide-react';
import { Store } from '../../types/erp';

interface ClearAllStoresConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resetOption: 'all_zero' | 'restore_initial') => void;
  stores: Store[];
  launchedCount?: number;
}

export const ClearAllStoresConfirmModal: React.FC<ClearAllStoresConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stores,
  launchedCount = 0,
}) => {
  const [resetOption, setResetOption] = useState<'all_zero' | 'restore_initial'>('all_zero');
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(resetOption);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header com estilo profissional de alerta do sistema */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent dark:from-rose-950/40 dark:via-amber-950/30">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-sm shrink-0">
              <Eraser className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Limpar Informações de Todas as Lojas
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Confirmação para iniciar um novo ciclo semanal de lançamentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Card de Alerta e Contexto Operacional */}
          <div className="p-4 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-rose-950 dark:text-rose-200 text-xs sm:text-sm">
                  Atenção: Ação Irreversível nas {stores.length} Filiais
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                  Esta ação limpará as informações de lançamento de <strong>todas as {stores.length} lojas da rede</strong> (Câmara Frigorífica, Balcão de Desossa, Nobres, Dianteiro, Coxão e Suíno).
                </p>
                <div className="pt-1 text-[11px] text-rose-700 dark:text-rose-300/90 font-medium">
                  {launchedCount > 0 ? (
                    <span>• Há atualmente <strong>{launchedCount} lojas com lançamentos registrados</strong> marcadas em verde.</span>
                  ) : (
                    <span>• Todas as abas voltarão à cor neutra padrão do sistema.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Destaque visual: O que acontece com as abas */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <StoreIcon className="w-4 h-4 text-amber-500" />
              <span>Status das Abas das Lojas no Próximo Ciclo:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-emerald-800 dark:text-emerald-300">
                  <strong>Antes:</strong> Verde (Lançada / Concluída)
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0"></span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  <strong>Após Limpar:</strong> Cor Neutra do Sistema (Liberada p/ Novo Lançamento)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Ao limpar, o checkmark (✓) e a cor verde serão removidos de todas as abas das lojas, sinalizando visualmente à equipe que a planilha está zerada e pronta para novas contagens.
            </p>
          </div>

          {/* Escolha do Método de Limpeza */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Selecione como deseja preparar o novo ciclo:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {/* Opção 1: Zerar Tudo (Padrão para início de semana) */}
              <div
                onClick={() => setResetOption('all_zero')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  resetOption === 'all_zero'
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg ${resetOption === 'all_zero' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Trash2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <span>Zerar Tudo (Valores em Branco / 0)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-600 text-white font-extrabold uppercase">Recomendado</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Zera pedidos, câmaras e balcões de todas as {stores.length} lojas para digitação limpa da semana.
                    </p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  resetOption === 'all_zero' ? 'border-rose-600 bg-rose-600' : 'border-slate-400'
                }`}>
                  {resetOption === 'all_zero' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Opção 2: Restaurar Valores de Referência da Matriz */}
              <div
                onClick={() => setResetOption('restore_initial')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  resetOption === 'restore_initial'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg ${resetOption === 'restore_initial' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <RotateCcw className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      Restaurar Valores Padrão da Planilha v10.7
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Recarrega a grade com os dados modelo oficiais de referência de cada filial.
                    </p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  resetOption === 'restore_initial' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                }`}>
                  {resetOption === 'restore_initial' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>
          </div>

          {/* Confirmação explícita por checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasConfirmedCheckbox}
              onChange={(e) => setHasConfirmedCheckbox(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
            />
            <span className="text-xs text-amber-950 dark:text-amber-200 font-semibold leading-relaxed">
              Confirmo que desejo limpar as informações de todas as {stores.length} lojas e liberar as abas com a cor original do sistema para um novo ciclo de lançamentos.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">As filiais e fórmulas serão mantidas.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              disabled={!hasConfirmedCheckbox}
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${
                resetOption === 'all_zero'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {resetOption === 'all_zero' ? (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Todas as Lojas</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar e Liberar Abas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
