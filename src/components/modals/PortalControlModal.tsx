import React, { useState } from 'react';
import { PortalLockConfig } from '../../types/erp';
import { StorageService } from '../../services/storageService';
import { 
  Clock, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertTriangle, 
  Save, 
  X, 
  Smartphone, 
  CheckCircle2,
  Calendar,
  Radio,
  Sparkles
} from 'lucide-react';

interface PortalControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: PortalLockConfig;
  onSaveConfig: (config: PortalLockConfig) => void;
}

export const PortalControlModal: React.FC<PortalControlModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig
}) => {
  const initial = currentConfig || StorageService.getPortalLockConfig();

  const [mode, setMode] = useState<PortalLockConfig['mode']>(initial.mode || 'LIBERADO');
  const [startTime, setStartTime] = useState<string>(initial.startTime || '06:00');
  const [endTime, setEndTime] = useState<string>(initial.endTime || '12:00');
  const [customMessage, setCustomMessage] = useState<string>(
    initial.customMessage || 'Lançamentos de contagem de câmara e desossa autorizados pelo Gestor.'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Calcula o status do portal no momento com a configuração atual
  const previewAccess = StorageService.checkPortalAccess({
    mode,
    startTime,
    endTime,
    customMessage
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: PortalLockConfig = {
      mode,
      startTime,
      endTime,
      customMessage: customMessage.trim(),
      updatedBy: 'Patrick Pessoa (Gestor)',
      updatedAt: Date.now()
    };
    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleQuickLock = () => {
    setMode('BLOQUEADO');
    setCustomMessage('Portal temporariamente bloqueado pela Gestão.');
  };

  const handleQuickUnlock = () => {
    setMode('LIBERADO');
    setCustomMessage('Lançamento de estoque liberado pelo Gestor para todas as filiais.');
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-50 to-transparent dark:from-amber-500/10 dark:via-slate-900 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                MÓDULO GESTOR • CONTROLE DE ACESSO
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Horários & Bloqueio do Portal Mobile
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Configuração do Portal salva e sincronizada com sucesso na nuvem!</span>
            </div>
          )}

          {/* Status Atual do Portal no Momento */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            previewAccess.isOpen 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/50' 
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/50'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${previewAccess.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {previewAccess.isOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Status Atual para os Operadores
                </span>
                <strong className={`text-sm ${previewAccess.isOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {previewAccess.isOpen ? '🟢 ABERTO (Lançamentos Permitidos)' : '🔴 BLOQUEADO (Lançamentos Fechados)'}
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {previewAccess.scheduleText}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleQuickUnlock}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
              >
                Liberar Agora
              </button>
              <button
                type="button"
                onClick={handleQuickLock}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
              >
                Bloquear Agora
              </button>
            </div>
          </div>

          {/* 1. Seleção do Modo de Funcionamento */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
              1. Modo de Funcionamento do Portal:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Opção 1: Sempre Liberado */}
              <button
                type="button"
                onClick={() => setMode('LIBERADO')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  mode === 'LIBERADO'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">Sempre Liberado</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${mode === 'LIBERADO' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'}`}>
                    {mode === 'LIBERADO' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Lançamentos disponíveis a qualquer momento (sem restrição de hora).
                </p>
              </button>

              {/* Opção 2: Horário Programado */}
              <button
                type="button"
                onClick={() => setMode('HORARIO_PROGRAMADO')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  mode === 'HORARIO_PROGRAMADO'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">Por Horário</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${mode === 'HORARIO_PROGRAMADO' ? 'border-amber-600 bg-amber-600' : 'border-slate-400'}`}>
                    {mode === 'HORARIO_PROGRAMADO' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Abre e fecha automaticamente nos horários programados abaixo.
                </p>
              </button>

              {/* Opção 3: Bloqueado Manualmente */}
              <button
                type="button"
                onClick={() => setMode('BLOQUEADO')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  mode === 'BLOQUEADO'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-rose-700 dark:text-rose-400">Bloqueado</span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${mode === 'BLOQUEADO' ? 'border-rose-600 bg-rose-600' : 'border-slate-400'}`}>
                    {mode === 'BLOQUEADO' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Bloqueia imediatamente todos os acessos dos operadores de loja.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Horários Programados (se modo == HORARIO_PROGRAMADO) */}
          {mode === 'HORARIO_PROGRAMADO' && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  2. Definição da Janela de Horário Permitido:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Horário de Início (Abertura):
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-900 dark:text-white text-center focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Horário Limite (Fechamento):
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-bold text-slate-900 dark:text-white text-center focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                * Os encarregados que tentarem acessar fora deste intervalo verão a mensagem informando exatamente o horário em que o portal será liberado.
              </p>
            </div>
          )}

          {/* 3. Mensagem para os Operadores */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
              3. Mensagem / Orientação Exibida aos Encarregados:
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ex: Favor lançar o estoque antes das 11:30 para fechamento do pedido geral..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Regras do Portal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
