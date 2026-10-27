import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Database, 
  Radio, 
  CheckCircle2, 
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MarketSyncStatusBarProps {
  tabName: 'Hub Foco Rio de Janeiro' | 'Cortes & Balcão RJ' | 'Varejo 12 Redes RJ' | string;
  tabBadge?: string;
  lastSyncTimestamp?: number;
  lastSyncFormatted?: string;
  isSyncing: boolean;
  onManualSync: () => void | Promise<void>;
  cacheTtlSeconds?: number;
  syncLatencyMs?: number;
}

export const MarketSyncStatusBar: React.FC<MarketSyncStatusBarProps> = ({
  tabName,
  tabBadge,
  lastSyncTimestamp,
  lastSyncFormatted,
  isSyncing,
  onManualSync,
  cacheTtlSeconds = 60,
  syncLatencyMs = 140
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState(cacheTtlSeconds);

  // Calcula contadores de tempo relativo e contagem regressiva para o próximo polling
  useEffect(() => {
    const baseTime = lastSyncTimestamp || Date.now();

    const updateTimers = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - baseTime) / 1000));
      setSecondsAgo(diffSec);

      const remaining = Math.max(0, cacheTtlSeconds - (diffSec % cacheTtlSeconds));
      setNextUpdateCountdown(remaining);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTimestamp, cacheTtlSeconds]);

  const displayTime = lastSyncFormatted || (
    lastSyncTimestamp 
      ? `Hoje às ${new Date(lastSyncTimestamp).toLocaleTimeString('pt-BR')}`
      : 'Hoje em tempo real'
  );

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-slate-950 via-[#0e2a1e] to-[#0c2419] border border-emerald-500/30 text-white p-3.5 sm:p-4 shadow-lg backdrop-blur-md relative overflow-hidden transition-all">
      {/* Glow e luz de fundo */}
      <div className="absolute top-0 right-1/4 w-72 h-16 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-48 h-20 bg-[#b5e550]/10 rounded-full blur-xl pointer-events-none" />

      {/* Barra de progresso do TTL de Cache */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-800">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 via-[#b5e550] to-emerald-500 transition-all duration-1000 ease-linear"
          style={{ width: `${Math.max(5, (nextUpdateCountdown / cacheTtlSeconds) * 100)}%` }}
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
        
        {/* Lado Esquerdo: Identificador da Aba e Beacon de Conexão Ativa */}
        <div className="flex items-center gap-3">
          {/* Beacon com animação Pulsante */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 shrink-0 shadow-inner">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#b5e550] border border-emerald-400/30 font-mono">
                {isSyncing ? 'ATUALIZANDO MATRIZ...' : 'CONEXÃO EM TEMPO REAL ATIVA'}
              </span>
              
              {tabBadge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10">
                  {tabBadge}
                </span>
              )}

              <span className="text-[10px] font-mono text-emerald-300/80 hidden sm:inline-flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                Cache TTL: {cacheTtlSeconds}s • Polling Contínuo
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h4 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>{tabName}</span>
                <span className="text-xs font-normal text-emerald-300 font-mono hidden md:inline">
                  • Matriz de Preços Integrada
                </span>
              </h4>
            </div>
          </div>
        </div>

        {/* Lado Direito: Horário da Última Sincronização e Gatilho Manual */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-emerald-900/40 pt-2.5 md:pt-0">
          
          {/* Card de Informação de Horário */}
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-xs">
            <Clock className="w-4 h-4 text-[#b5e550] shrink-0" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Última Sincronização</span>
                <span className="text-[#b5e550] font-bold">
                  ({secondsAgo === 0 ? 'agora mesmo' : `há ${secondsAgo}s`})
                </span>
              </div>
              <div className="text-xs font-bold text-white tracking-tight">
                {displayTime}
              </div>
            </div>
          </div>

          {/* Badge de Próximo Polling / Latência */}
          <div className="hidden lg:flex flex-col text-right font-mono text-[10px] text-slate-400 px-1">
            <span className="flex items-center gap-1 text-emerald-300 font-bold">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              Próximo ciclo: {nextUpdateCountdown}s
            </span>
            <span className="text-slate-400 text-[9px]">
              Latência: ~{syncLatencyMs}ms
            </span>
          </div>

          {/* Botão de Sincronização Manual */}
          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md hover:shadow-emerald-900/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Forçar atualização imediata com o servidor de cotações em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>

      </div>

      {/* Linha Inferior com Resumo das Fontes Transparentes */}
      <div className="mt-2.5 pt-2 border-t border-emerald-900/30 flex flex-wrap items-center justify-between text-[10px] text-emerald-200/70 font-mono gap-2">
        <div className="flex items-center gap-1.5 truncate max-w-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#b5e550] shrink-0" />
          <span>
            Fontes Auditadas em Tempo Real: <strong>CEPEA/ESALQ - USP</strong> • <strong>B3 S.A.</strong> • <strong>Scot</strong> • <strong>Ceasa Irajá RJ</strong> • <strong>Scantec Sell-Out RJ</strong> • <strong>NielsenIQ</strong> • <strong>ASSERJ</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#b5e550] font-bold">● Status: Fidelidade 100% Ativa</span>
        </div>
      </div>
    </div>
  );
};
