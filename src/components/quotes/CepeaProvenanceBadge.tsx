import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useCentralizedCepeaQuote } from '../../services/quoteService';

interface CepeaProvenanceBadgeProps {
  variant?: 'banner' | 'pill' | 'compact' | 'dark-pill';
  showPrice?: boolean;
  showRefreshButton?: boolean;
  customSourceLabel?: string;
  className?: string;
}

export const CepeaProvenanceBadge: React.FC<CepeaProvenanceBadgeProps> = ({
  variant = 'pill',
  showPrice = true,
  showRefreshButton = true,
  customSourceLabel,
  className = '',
}) => {
  const { quoteState, refreshNow } = useCentralizedCepeaQuote();
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  useEffect(() => {
    const updateRelative = () => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - (quoteState.lastSuccessTimestamp || Date.now())) / 1000)
      );
      setSecondsAgo(diff);
    };
    updateRelative();
    const timer = window.setInterval(updateRelative, 1000);
    return () => window.clearInterval(timer);
  }, [quoteState.lastSuccessTimestamp]);

  const relativeLabel =
    secondsAgo <= 2
      ? 'agora mesmo'
      : secondsAgo < 60
      ? `há ${secondsAgo}s`
      : `há ${Math.floor(secondsAgo / 60)}m ${secondsAgo % 60}s`;

  const isPositive = quoteState.varDiaPercent >= 0;
  const sourceText = customSourceLabel || quoteState.sourceBadge || 'Fonte: CEPEA';

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs ${className}`}
      >
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#113829] text-[#b5e550] font-mono font-extrabold text-[10px] tracking-wide uppercase shadow-2xs">
          <ShieldCheck className="w-3 h-3 text-[#b5e550] shrink-0" />
          <span>{sourceText}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
          <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Última atualização:{' '}
            <strong className="font-bold text-slate-900 dark:text-white">
              {quoteState.lastSuccessFormatted}
            </strong>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            ({relativeLabel})
          </span>
        </span>
      </div>
    );
  }

  if (variant === 'dark-pill') {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-white text-xs shadow-sm ${className}`}
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#b5e550] text-[#0c281e] font-mono font-black text-[10px] uppercase tracking-wider shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0c281e] shrink-0" />
          <span>{sourceText}</span>
        </span>

        {showPrice && (
          <div className="inline-flex items-center gap-1.5 font-mono text-xs border-r border-emerald-800/70 pr-2.5">
            <span className="text-emerald-200/80 text-[10px] font-bold uppercase">
              Boi Gordo SP:
            </span>
            <strong className="text-white font-black">
              R$ {quoteState.boiGordoPriceBrl.toFixed(2).replace('.', ',')}/@
            </strong>
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isPositive
                  ? 'bg-emerald-500/20 text-[#b5e550]'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              {isPositive ? '+' : ''}
              {quoteState.varDiaPercent.toFixed(2)}%
            </span>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-100">
          <Clock className="w-3.5 h-3.5 text-[#b5e550] shrink-0" />
          <span>
            Última atualização bem-sucedida:{' '}
            <strong className="text-white font-bold">{quoteState.lastSuccessFormatted}</strong>
          </span>
          <span className="text-[10px] text-[#b5e550] font-bold">({relativeLabel})</span>
        </div>

        {showRefreshButton && (
          <button
            type="button"
            onClick={() => refreshNow()}
            disabled={quoteState.isFetching}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-[#b5e550] font-bold text-[10px] transition cursor-pointer disabled:opacity-50"
            title="Forçar verificação imediata da cotação oficial CEPEA/ESALQ em segundo plano"
          >
            <RefreshCw className={`w-3 h-3 ${quoteState.isFetching ? 'animate-spin' : ''}`} />
            <span>{quoteState.isFetching ? 'Sincronizando...' : 'Verificar'}</span>
          </button>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`w-full rounded-2xl bg-gradient-to-r from-[#0c281e] via-[#113829] to-[#174634] border border-emerald-500/40 text-white px-4 py-2.5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 ${className}`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selo Principal Fonte: CEPEA */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#b5e550] text-[#0c281e] font-mono font-black text-[11px] uppercase tracking-wider shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0c281e] shrink-0" />
            <span>{sourceText}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-mono text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#b5e550] animate-pulse" />
            <span>Worker Ativo (45s) • {quoteState.sourceInstitution}</span>
          </span>

          {showPrice && (
            <div className="inline-flex flex-wrap items-center gap-2 text-xs font-mono pl-1">
              <span className="text-emerald-200/90">Boi Gordo CEPEA/B3:</span>
              <strong className="text-sm font-black text-white">
                R$ {quoteState.boiGordoPriceBrl.toFixed(2).replace('.', ',')}/@
              </strong>
              <span className="text-[11px] text-emerald-200/80">
                (R$ {quoteState.carcassKgBrl.toFixed(2).replace('.', ',')}/kg • US${' '}
                {quoteState.boiGordoPriceUsd.toFixed(2)})
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isPositive
                    ? 'bg-[#b5e550]/20 text-[#b5e550]'
                    : 'bg-rose-500/25 text-rose-200'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? '+' : ''}
                {quoteState.varDiaPercent.toFixed(2)}% (Ref. {quoteState.referenceDate})
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 justify-between lg:justify-end border-t lg:border-t-0 border-emerald-800/50 pt-2 lg:pt-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/25 border border-emerald-400/25 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#b5e550] shrink-0" />
            <span className="text-emerald-200/90">Última atualização bem-sucedida:</span>
            <strong className="text-white font-bold">{quoteState.lastSuccessFormatted}</strong>
            <span className="text-[10px] text-[#b5e550] font-bold">({relativeLabel})</span>
          </div>

          {showRefreshButton && (
            <button
              type="button"
              onClick={() => refreshNow()}
              disabled={quoteState.isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#b5e550] hover:bg-[#a6d741] text-[#0c281e] font-extrabold text-[11px] shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Atualizar cotação oficial do CEPEA agora"
            >
              <RefreshCw
                className={`w-3 h-3 ${quoteState.isFetching ? 'animate-spin' : ''}`}
              />
              <span>{quoteState.isFetching ? 'Atualizando...' : 'Atualizar CEPEA'}</span>
            </button>
          )}

          <a
            href={quoteState.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-[10px] font-mono font-bold transition"
            title="Conferir procedência no portal oficial cepea.esalq.usp.br"
          >
            <span>cepea.esalq.usp.br</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    );
  }

  // Default variant: 'pill' (Light/Adaptive pill for headers and cards)
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#f4f7f4] dark:bg-slate-800/90 border border-emerald-600/30 text-xs ${className}`}
    >
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#113829] text-[#b5e550] font-mono font-black text-[10px] uppercase tracking-wider shadow-2xs">
        <ShieldCheck className="w-3 h-3 text-[#b5e550] shrink-0" />
        <span>{sourceText}</span>
      </span>

      {showPrice && (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-800 dark:text-slate-100 font-bold">
          <span>Boi Gordo:</span>
          <strong className="text-[#113829] dark:text-[#b5e550] font-black">
            R$ {quoteState.boiGordoPriceBrl.toFixed(2).replace('.', ',')}/@
          </strong>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
              isPositive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {isPositive ? '+' : ''}
            {quoteState.varDiaPercent.toFixed(2)}%
          </span>
        </span>
      )}

      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
        <Clock className="w-3.5 h-3.5 text-[#113829] dark:text-[#b5e550] shrink-0" />
        <span>
          Última atualização bem-sucedida:{' '}
          <strong className="text-slate-900 dark:text-white font-bold">
            {quoteState.lastSuccessFormatted}
          </strong>
        </span>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
          ({relativeLabel})
        </span>
      </span>

      {showRefreshButton && (
        <button
          type="button"
          onClick={() => refreshNow()}
          disabled={quoteState.isFetching}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#113829] hover:bg-[#1a4f3b] text-white font-bold text-[10px] transition cursor-pointer disabled:opacity-50"
          title="Sincronizar cotação CEPEA agora"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${quoteState.isFetching ? 'animate-spin' : ''}`} />
          <span>{quoteState.isFetching ? 'Sinc...' : 'Sync'}</span>
        </button>
      )}
    </div>
  );
};
