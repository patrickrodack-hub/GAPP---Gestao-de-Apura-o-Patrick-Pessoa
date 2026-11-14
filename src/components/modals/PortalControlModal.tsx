import React, { useState, useEffect, useMemo } from 'react';
import { DayOfWeekKey, PortalDaySchedule, PortalLockConfig } from '../../types/erp';
import {
  PORTAL_WEEKDAY_DEFS,
  StorageService,
  normalizePortalWeeklySchedule,
} from '../../services/storageService';
import {
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  Save,
  X,
  Smartphone,
  CheckCircle2,
  CalendarDays,
  CopyCheck,
} from 'lucide-react';

interface PortalControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: PortalLockConfig;
  onSaveConfig: (config: PortalLockConfig) => void;
  onOpenConnectedDevices?: () => void;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function formatDurationMinutes(totalMins: number): string {
  if (totalMins <= 0) return 'Inválido';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h00`;
}

export const PortalControlModal: React.FC<PortalControlModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  onOpenConnectedDevices,
}) => {
  const initial = currentConfig || StorageService.getPortalLockConfig();

  const [mode, setMode] = useState<PortalLockConfig['mode']>(initial.mode || 'LIBERADO');
  const [startTime, setStartTime] = useState<string>(initial.startTime || '06:00');
  const [endTime, setEndTime] = useState<string>(initial.endTime || '12:00');
  const [weeklySchedule, setWeeklySchedule] = useState<PortalDaySchedule[]>(() =>
    normalizePortalWeeklySchedule(
      initial.weeklySchedule,
      initial.startTime || '06:00',
      initial.endTime || '12:00'
    )
  );
  const [customMessage, setCustomMessage] = useState<string>(
    initial.customMessage ||
      'Lançamentos de contagem de câmara e desossa autorizados pelo Gestor.'
  );
  const [batchOpenTime, setBatchOpenTime] = useState<string>(initial.startTime || '06:00');
  const [batchCloseTime, setBatchCloseTime] = useState<string>(initial.endTime || '12:00');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [nowTick, setNowTick] = useState<Date>(() => new Date());

  // Sincroniza estado ao abrir o modal com a configuração mais recente
  useEffect(() => {
    if (!isOpen) return;
    const cfg = currentConfig || StorageService.getPortalLockConfig();
    const sTime = cfg.startTime || '06:00';
    const eTime = cfg.endTime || '12:00';
    setMode(cfg.mode || 'LIBERADO');
    setStartTime(sTime);
    setEndTime(eTime);
    setWeeklySchedule(normalizePortalWeeklySchedule(cfg.weeklySchedule, sTime, eTime));
    setBatchOpenTime(sTime);
    setBatchCloseTime(eTime);
    setCustomMessage(
      cfg.customMessage ||
        'Lançamentos de contagem de câmara e desossa autorizados pelo Gestor.'
    );
    setValidationError(null);
    setSavedSuccess(false);
    setNowTick(new Date());
  }, [isOpen, currentConfig]);

  // Atualiza relógio de pré-visualização em tempo real enquanto o modal está aberto
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(() => setNowTick(new Date()), 10_000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const todayDayKey: DayOfWeekKey = useMemo(() => {
    const jsDay = nowTick.getDay();
    return (PORTAL_WEEKDAY_DEFS.find(d => d.jsDay === jsDay) || PORTAL_WEEKDAY_DEFS[0]).day;
  }, [nowTick]);

  const invalidDays = useMemo(() => {
    if (mode !== 'HORARIO_PROGRAMADO') return [];
    return weeklySchedule.filter(
      item => item.enabled && timeToMinutes(item.closeTime) <= timeToMinutes(item.openTime)
    );
  }, [mode, weeklySchedule]);

  if (!isOpen) return null;

  // Prévia em tempo real obedecendo exatamente a regra configurada
  const previewAccess = StorageService.checkPortalAccess(
    {
      mode,
      startTime,
      endTime,
      weeklySchedule,
      customMessage,
    },
    nowTick
  );

  const handleToggleDay = (dayKey: DayOfWeekKey) => {
    setValidationError(null);
    setWeeklySchedule(prev =>
      prev.map(item => (item.day === dayKey ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleDayTimeChange = (
    dayKey: DayOfWeekKey,
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setValidationError(null);
    setWeeklySchedule(prev =>
      prev.map(item => (item.day === dayKey ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyBatchToEnabled = () => {
    if (timeToMinutes(batchCloseTime) <= timeToMinutes(batchOpenTime)) {
      setValidationError(
        'O horário de fechamento em lote deve ser maior que o horário de abertura.'
      );
      return;
    }
    setValidationError(null);
    setStartTime(batchOpenTime);
    setEndTime(batchCloseTime);
    setWeeklySchedule(prev =>
      prev.map(item =>
        item.enabled
          ? { ...item, openTime: batchOpenTime, closeTime: batchCloseTime }
          : item
      )
    );
  };

  const handleApplyPresetDays = (preset: 'weekdays' | 'mon_sat' | 'all') => {
    setValidationError(null);
    setWeeklySchedule(prev =>
      prev.map(item => {
        if (preset === 'all') return { ...item, enabled: true };
        if (preset === 'mon_sat') return { ...item, enabled: item.day !== 'domingo' };
        return {
          ...item,
          enabled: item.day !== 'sabado' && item.day !== 'domingo',
        };
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'HORARIO_PROGRAMADO') {
      if (invalidDays.length > 0) {
        setValidationError(
          `Horário inválido em ${invalidDays
            .map(d => d.label)
            .join(', ')}: o fechamento deve ser posterior à abertura.`
        );
        return;
      }
      const anyEnabled = weeklySchedule.some(d => d.enabled);
      if (!anyEnabled) {
        setValidationError(
          'Ative pelo menos 1 dia da semana na programação ou selecione o modo "Bloqueado".'
        );
        return;
      }
    }

    const firstEnabled = weeklySchedule.find(d => d.enabled);
    const newConfig: PortalLockConfig = {
      mode,
      startTime: firstEnabled?.openTime || startTime,
      endTime: firstEnabled?.closeTime || endTime,
      weeklySchedule,
      customMessage: customMessage.trim(),
      updatedBy: 'Patrick Pessoa (Gestor)',
      updatedAt: Date.now(),
    };
    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1100);
  };

  const handleQuickLock = () => {
    setValidationError(null);
    setMode('BLOQUEADO');
    setCustomMessage('Portal temporariamente bloqueado pela Gestão.');
  };

  const handleQuickUnlock = () => {
    setValidationError(null);
    setMode('LIBERADO');
    setCustomMessage('Lançamento de estoque liberado pelo Gestor para todas as filiais.');
  };

  const activeDaysCount = weeklySchedule.filter(d => d.enabled).length;
  const currentMinutesNow = nowTick.getHours() * 60 + nowTick.getMinutes();

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] transition-all duration-200 ${
          mode === 'HORARIO_PROGRAMADO' ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-50 to-transparent dark:from-amber-500/10 dark:via-slate-900 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                MÓDULO GESTOR • CONTROLE DE ACESSO
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Horários &amp; Bloqueio do Portal Mobile
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSave}
          className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300"
        >
          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Programação e regras do Portal salvas e sincronizadas com sucesso!</span>
            </div>
          )}

          {validationError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Status Atual do Portal no Momento */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              previewAccess.isOpen
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/50'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  previewAccess.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {previewAccess.isOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  Status Atual para os Operadores ({nowTick.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
                </span>
                <strong
                  className={`text-sm block ${
                    previewAccess.isOpen
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {previewAccess.isOpen
                    ? '🟢 ABERTO (Lançamentos Permitidos)'
                    : '🔴 BLOQUEADO (Lançamentos Fechados)'}
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
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
                onClick={() => {
                  setValidationError(null);
                  setMode('LIBERADO');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  mode === 'LIBERADO'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                    Sempre Liberado
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      mode === 'LIBERADO'
                        ? 'border-emerald-600 bg-emerald-600'
                        : 'border-slate-400'
                    }`}
                  >
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
                onClick={() => {
                  setValidationError(null);
                  setMode('HORARIO_PROGRAMADO');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  mode === 'HORARIO_PROGRAMADO'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">
                    Por Horário
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      mode === 'HORARIO_PROGRAMADO'
                        ? 'border-amber-600 bg-amber-600'
                        : 'border-slate-400'
                    }`}
                  >
                    {mode === 'HORARIO_PROGRAMADO' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Abre e fecha automaticamente conforme a grade semanal de Segunda a Domingo.
                </p>
              </button>

              {/* Opção 3: Bloqueado Manualmente */}
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setMode('BLOQUEADO');
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  mode === 'BLOQUEADO'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-rose-700 dark:text-rose-400">
                    Bloqueado
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      mode === 'BLOQUEADO' ? 'border-rose-600 bg-rose-600' : 'border-slate-400'
                    }`}
                  >
                    {mode === 'BLOQUEADO' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Bloqueia imediatamente todos os acessos dos operadores de loja.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Listagem de Programação Semanal (Segunda a Domingo) */}
          {mode === 'HORARIO_PROGRAMADO' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/15 border border-amber-300/60 dark:border-amber-700/40 space-y-3.5">
              {/* Cabeçalho da Grade Semanal */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      2. Programação Semanal de Liberação (Segunda a Domingo)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {activeDaysCount} de 7 dias ativos • O portal libera e bloqueia automaticamente nos horários definidos
                    </span>
                  </div>
                </div>

                {/* Atalhos rápidos de seleção de dias */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDays('weekdays')}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    Seg–Sex
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDays('mon_sat')}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    Seg–Sáb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDays('all')}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Barra de Aplicação Rápida de Horário em Lote */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-amber-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Padrão p/ dias ativos:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Abre:</span>
                    <input
                      type="time"
                      value={batchOpenTime}
                      onChange={e => setBatchOpenTime(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Fecha:</span>
                    <input
                      type="time"
                      value={batchCloseTime}
                      onChange={e => setBatchCloseTime(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyBatchToEnabled}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] shadow-2xs transition cursor-pointer"
                  >
                    <CopyCheck className="w-3 h-3" />
                    <span>Aplicar nos ativos</span>
                  </button>
                </div>
              </div>

              {/* Listagem dos 7 dias: Segunda-feira a Domingo */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* Cabeçalho da Tabela */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div className="col-span-4">Dia da Semana</div>
                  <div className="col-span-3 text-center">Abertura</div>
                  <div className="col-span-3 text-center">Fechamento</div>
                  <div className="col-span-2 text-right">Status</div>
                </div>

                {weeklySchedule.map(dayItem => {
                  const isToday = dayItem.day === todayDayKey;
                  const openMins = timeToMinutes(dayItem.openTime);
                  const closeMins = timeToMinutes(dayItem.closeTime);
                  const diffMins = closeMins - openMins;
                  const isInvalid = dayItem.enabled && diffMins <= 0;
                  const isLiveNow =
                    isToday &&
                    dayItem.enabled &&
                    !isInvalid &&
                    currentMinutesNow >= openMins &&
                    (dayItem.closeTime === '23:59'
                      ? currentMinutesNow <= closeMins
                      : currentMinutesNow < closeMins);

                  return (
                    <div
                      key={dayItem.day}
                      className={`grid grid-cols-1 sm:grid-cols-12 items-center gap-2 sm:gap-2 px-3.5 py-2.5 transition-colors ${
                        isInvalid
                          ? 'bg-rose-50/70 dark:bg-rose-950/30'
                          : isLiveNow
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : !dayItem.enabled
                          ? 'bg-slate-50/60 dark:bg-slate-900/40 opacity-75'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      {/* Coluna 1: Switch + Nome do Dia */}
                      <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={dayItem.enabled}
                            onClick={() => handleToggleDay(dayItem.day)}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                              dayItem.enabled
                                ? 'bg-emerald-500'
                                : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            title={
                              dayItem.enabled
                                ? `Desativar ${dayItem.label}`
                                : `Ativar ${dayItem.label}`
                            }
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                                dayItem.enabled ? 'translate-x-4.5' : 'translate-x-1'
                              }`}
                            />
                          </button>

                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`font-bold text-xs truncate ${
                                dayItem.enabled
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-400 dark:text-slate-500 line-through'
                              }`}
                            >
                              {dayItem.label}
                            </span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider shrink-0">
                                Hoje
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status compacto no mobile */}
                        <span className="sm:hidden text-[10px] font-bold">
                          {!dayItem.enabled ? (
                            <span className="text-slate-400">Fechado</span>
                          ) : isInvalid ? (
                            <span className="text-rose-600">Inválido</span>
                          ) : isLiveNow ? (
                            <span className="text-emerald-600">Aberto agora</span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300 font-mono">
                              {formatDurationMinutes(diffMins)}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Coluna 2 & 3: Inputs de Abertura e Fechamento */}
                      <div className="sm:col-span-6 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="sm:hidden text-[10px] font-semibold text-slate-500 w-10">
                            Abre:
                          </span>
                          <input
                            type="time"
                            value={dayItem.openTime}
                            disabled={!dayItem.enabled}
                            onChange={e =>
                              handleDayTimeChange(dayItem.day, 'openTime', e.target.value)
                            }
                            className={`w-full rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center border transition focus:outline-none ${
                              !dayItem.enabled
                                ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                                : isInvalid
                                ? 'bg-white dark:bg-slate-950 border-rose-400 text-rose-700 dark:text-rose-300 focus:border-rose-500'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500'
                            }`}
                            required={dayItem.enabled}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="sm:hidden text-[10px] font-semibold text-slate-500 w-10">
                            Fecha:
                          </span>
                          <input
                            type="time"
                            value={dayItem.closeTime}
                            disabled={!dayItem.enabled}
                            onChange={e =>
                              handleDayTimeChange(dayItem.day, 'closeTime', e.target.value)
                            }
                            className={`w-full rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-center border transition focus:outline-none ${
                              !dayItem.enabled
                                ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                                : isInvalid
                                ? 'bg-white dark:bg-slate-950 border-rose-400 text-rose-700 dark:text-rose-300 focus:border-rose-500'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-amber-500'
                            }`}
                            required={dayItem.enabled}
                          />
                        </div>
                      </div>

                      {/* Coluna 4: Duração / Estado */}
                      <div className="hidden sm:flex sm:col-span-2 justify-end">
                        {!dayItem.enabled ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                            Fechado
                          </span>
                        ) : isInvalid ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                            Inválido
                          </span>
                        ) : isLiveNow ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                            Ativo agora
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                            {formatDurationMinutes(diffMins)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                * Os encarregados só poderão entrar e enviar lançamentos nos dias ativados e dentro da respectiva janela de abertura e fechamento. Fora da programação, o portal exibe o horário da próxima liberação.
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
              onChange={e => setCustomMessage(e.target.value)}
              placeholder="Ex: Favor lançar o estoque antes das 11:30 para fechamento do pedido geral..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            {onOpenConnectedDevices ? (
              <button
                type="button"
                onClick={onOpenConnectedDevices}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                title="Ver lista de aparelhos e celulares conectados ao portal"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                <span>Ver Aparelhos Conectados</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
};
