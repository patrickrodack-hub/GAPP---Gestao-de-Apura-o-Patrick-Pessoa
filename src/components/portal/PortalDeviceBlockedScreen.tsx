import React from 'react';
import { 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  Smartphone, 
  Wifi, 
  MessageCircle, 
  ArrowLeft, 
  AlertTriangle,
  Building2,
  Clock
} from 'lucide-react';
import { ConnectedDevice } from '../../types/erp';
import { DeviceInfo } from '../../utils/deviceInfo';

interface PortalDeviceBlockedScreenProps {
  deviceInfo?: DeviceInfo | null;
  blockedDevice?: ConnectedDevice | null;
  onCheckStatus: () => void;
  isChecking?: boolean;
  onSwitchToAdmin?: () => void;
}

export const PortalDeviceBlockedScreen: React.FC<PortalDeviceBlockedScreenProps> = ({
  deviceInfo,
  blockedDevice,
  onCheckStatus,
  isChecking = false,
  onSwitchToAdmin
}) => {
  const ip = blockedDevice?.ip || deviceInfo?.ip || '187.58.XX.XX';
  const mac = blockedDevice?.macAddress || deviceInfo?.macAddress || '48:2C:A0:XX:XX:XX';
  const model = blockedDevice?.deviceModel || deviceInfo?.deviceModel || 'Smartphone Android';
  const reason = blockedDevice?.blockedReason || 'Dispositivo temporariamente suspenso pela administração central.';
  const blockedBy = blockedDevice?.blockedBy || 'Patrick Pessoa (Direção)';
  const blockedAt = blockedDevice?.blockedAt ? new Date(blockedDevice.blockedAt).toLocaleString('pt-BR') : 'Recentemente';

  const handleWhatsAppSupport = () => {
    const text = encodeURIComponent(
      `Olá Patrick, meu aparelho foi bloqueado no Portal de Estoque.\n` +
      `*Aparelho:* ${model}\n` +
      `*IP:* ${ip}\n` +
      `*MAC:* ${mac}\n` +
      `*Motivo exibido:* ${reason}\n` +
      `Poderia verificar a liberação no Módulo de Aparelhos Conectados? Obrigado!`
    );
    window.open(`https://wa.me/5521999999999?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between p-4 sm:p-6 bg-slate-950 text-white animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-2 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-950/80 p-0.5 border border-rose-500/40 shadow-md flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-400 block">
              PATRICK PESSOA • SEGURANÇA INTEGRAL
            </span>
            <h1 className="text-sm font-bold text-white leading-tight">
              Portal Mobile de Estoque & Câmaras
            </h1>
          </div>
        </div>
      </div>

      {/* Main Alert Card */}
      <div className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-slate-900/90 border border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/50 text-center relative overflow-hidden backdrop-blur-md">
          {/* Subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner mb-5 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-rose-400" />
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-rose-600 text-white shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
            ACESSO SUSPENSO
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Aparelho Bloqueado
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Este dispositivo teve o acesso ao lançamento de estoque bloqueado pela administração do sistema.
          </p>

          {/* Details Box */}
          <div className="mt-5 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left text-xs space-y-2.5">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-850">
              <span className="text-slate-400 font-medium">Motivo do Bloqueio:</span>
              <span className="font-bold text-rose-300 text-right">{reason}</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Responsável:</span>
              <span className="font-semibold text-slate-200">{blockedBy}</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Registrado em:</span>
              <span className="text-slate-300">{blockedAt}</span>
            </div>

            <div className="pt-2 border-t border-slate-850 grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900 p-2 rounded-xl">
                <span className="text-[9px] uppercase font-sans text-slate-500 block">Endereço IP</span>
                <span className="font-bold text-slate-200">{ip}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl">
                <span className="text-[9px] uppercase font-sans text-slate-500 block">Endereço MAC</span>
                <span className="font-bold text-slate-200">{mac}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Aparelho: {model}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2.5">
            <button
              onClick={onCheckStatus}
              disabled={isChecking}
              className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Verificando com o Servidor...' : 'Verificar se Já Foi Liberado'}</span>
            </button>

            <button
              onClick={handleWhatsAppSupport}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Solicitar Liberação com o Gestor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-3 text-[11px] text-slate-500 max-w-md mx-auto w-full">
        {onSwitchToAdmin && (
          <button
            onClick={onSwitchToAdmin}
            className="text-xs text-slate-400 hover:text-white underline mb-1 block mx-auto"
          >
            Voltar ao Sistema de Gestão (Direção)
          </button>
        )}
        <span>Segurança Corporativa • Conexão Monitorada e Auditada</span>
      </div>
    </div>
  );
};
