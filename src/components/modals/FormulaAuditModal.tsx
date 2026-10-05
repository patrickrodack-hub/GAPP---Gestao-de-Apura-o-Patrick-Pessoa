import React from 'react';
import { SheetRowData } from '../../types/erp';
import { SheetAuditReport } from '../../services/formulaAuditService';
import { recalculateRowOrderFormulas, CutYieldWeights } from '../../services/calculationService';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  X, 
  Calculator,
  RefreshCw,
  Info
} from 'lucide-react';

interface FormulaAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditReport: SheetAuditReport;
  rows: SheetRowData[];
  onUpdateMultiple: (rows: SheetRowData[]) => void;
  currentCutWeights: CutYieldWeights;
  onJumpToCell?: (rowIdx: number, field: keyof SheetRowData) => void;
}

export const FormulaAuditModal: React.FC<FormulaAuditModalProps> = ({
  isOpen,
  onClose,
  auditReport,
  rows,
  onUpdateMultiple,
  currentCutWeights,
  onJumpToCell,
}) => {
  if (!isOpen) return null;

  const handleFixAllDiscrepancies = () => {
    const updated = rows.map(r => recalculateRowOrderFormulas(r, currentCutWeights));
    onUpdateMultiple(updated);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          auditReport.isValid 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-rose-500/10 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`p-2.5 rounded-xl border ${
              auditReport.isValid
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              {auditReport.isValid ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Auditoria Matemática de Fórmulas em Tempo Real
                {auditReport.isValid ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    100% Validado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                    {auditReport.discrepanciesCount} {auditReport.discrepanciesCount === 1 ? 'Divergência' : 'Divergências'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verificação das constantes 35 (Dianteiro/Coxão), 22 (Alcatrão), divisão do Boi (/2) e somatórios de câmaras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 block text-[11px]">Total de Células Auditadas</span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {auditReport.totalChecked} cálculos
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 block text-[11px]">Status das Constantes</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
              Fatores: 35 | 22 | 36 | ÷2
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${
            auditReport.isValid
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}>
            <span className="block text-[11px]">Divergências Encontradas</span>
            <span className="text-base font-bold font-mono">
              {auditReport.discrepanciesCount} células
            </span>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 text-xs">
          {auditReport.isValid ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Todas as Fórmulas Estão Perfeitamente Equalizadas!
              </h4>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                Todos os somatórios de Dianteiro, Traseiro, Coxão, Alcatrão, Câmara, Boi e Sugestão estão rigorosamente alinhados com as regras operacionais da Direção da Empresa.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Detalhamento das Divergências Detectadas:
                </span>
                <span className="text-[11px] text-slate-500">
                  Células divergentes destacadas em vermelho na tabela
                </span>
              </div>

              <div className="space-y-2">
                {auditReport.discrepancies.map((d, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-rose-400"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {d.storeName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-mono text-[11px] font-bold">
                          {d.columnLabel} ({d.group})
                        </span>
                        {d.factorUsed && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                            Fator ÷{d.factorUsed}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Regra: {d.formulaRule}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Atual vs Esperado</div>
                        <div className="font-mono text-xs">
                          <span className="text-rose-600 dark:text-rose-400 font-bold line-through mr-1.5">
                            {d.currentValue}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ➔ {d.expectedValue}
                          </span>
                        </div>
                      </div>

                      {onJumpToCell && (
                        <button
                          onClick={() => {
                            onJumpToCell(d.rowIdx, d.field);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
                        >
                          Ir p/ Célula
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calculator className="w-4 h-4 text-blue-500" />
            <span>Auditoria recalculada automaticamente a cada caractere digitado</span>
          </div>

          <div className="flex items-center gap-2">
            {!auditReport.isValid && (
              <button
                onClick={handleFixAllDiscrepancies}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-95"
              >
                <Wrench className="w-4 h-4" />
                <span>Corrigir Todas com 1 Clique</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
