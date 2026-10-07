import React, { useState, useEffect } from 'react';
import { Database, Cloud, CloudOff, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SolidconStatusBarProps {
  storeCount: number;
  isCloudConnected?: boolean;
}

export const SolidconStatusBar: React.FC<SolidconStatusBarProps> = ({ storeCount, isCloudConnected = true }) => {
  const [capsLock, setCapsLock] = useState(false);
  const [numLock, setNumLock] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.getModifierState) {
        setCapsLock(e.getModifierState('CapsLock'));
        setNumLock(e.getModifierState('NumLock'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  return (
    <footer 
      className="h-7 px-2.5 flex items-center justify-between text-[11px] font-sans text-slate-800 bg-[#e0e0e0] border-t border-[#b0bec5] z-30 select-none shadow-inner"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)'
      }}
    >
      {/* Left items: Realtime DB Connection State & Network Information */}
      <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
        
        {/* Indicador Visual Detalhado do Banco de Dados em Tempo Real */}
        <div 
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors shadow-2xs ${
            isCloudConnected 
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
              : 'bg-amber-100 text-amber-950 border-amber-300'
          }`}
          title={
            isCloudConnected 
              ? 'Banco de dados Firestore conectado em tempo real. Gravação e sincronização automáticas entre todas as filiais.' 
              : 'Operando em modo local offline. As alterações estão seguras no cache e serão sincronizadas com o Firestore ao reconectar.'
          }
        >
          {/* Ponto Pulsante de Status em Tempo Real */}
          <span className="relative flex h-2 w-2 shrink-0">
            {isCloudConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </>
            ) : (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
              </>
            )}
          </span>

          {/* Ícone de Nuvem / Banco */}
          {isCloudConnected ? (
            <Database className="w-3 h-3 shrink-0 text-emerald-700" />
          ) : (
            <AlertTriangle className="w-3 h-3 shrink-0 text-amber-700" />
          )}

          {/* Rótulo Principal: 'Online - Sincronizado' ou 'Offline - Local' */}
          <span className="tracking-wide">
            {isCloudConnected ? 'Online - Sincronizado' : 'Offline - Local'}
          </span>

          {/* Badge Informativo Secundário */}
          <span className={`text-[9px] px-1 py-0.5 rounded font-mono hidden sm:inline ${
            isCloudConnected ? 'bg-emerald-200/90 text-emerald-900' : 'bg-amber-200/90 text-amber-900'
          }`}>
            {isCloudConnected ? 'FIRESTORE' : 'CACHE'}
          </span>
        </div>

        {/* Matriz e Lojas */}
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px] border-l border-slate-300 pl-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span className="hidden sm:inline">MATRIZ •</span>
          <span>{storeCount} Filiais</span>
        </div>

        {/* Identificação Corporativa */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-500 font-mono text-[10px] border-l border-slate-300 pl-2.5">
          <span>GRUPO GAPP SISTEMAS v10.6</span>
        </div>
      </div>

      {/* Right items: Exactly like the uploaded image: Date | Patrick Pessoa | Version */}
      <div className="flex items-center divide-x divide-slate-400 font-sans text-[11px]">
        
        {/* Keyboard indicators */}
        <div className="hidden lg:flex items-center gap-2 px-2 text-[10px] font-mono font-bold text-slate-500">
          <span className={capsLock ? 'text-amber-700 font-black' : 'text-slate-400'}>CAPS</span>
          <span className={numLock ? 'text-emerald-700 font-black' : 'text-slate-400'}>NUM</span>
        </div>

        {/* Date: Exactly like in the screenshot "28/09/2026" / "01/10/2026" */}
        <div className="px-2.5 font-mono text-slate-800 font-semibold">
          01/10/2026
        </div>

        {/* User: Exactly "Patrick Pessoa" */}
        <div className="px-2.5 font-bold text-slate-900 bg-slate-200/60">
          Patrick Pessoa
        </div>

        {/* Version: Exactly "1.1.8719" */}
        <div className="pl-2.5 font-mono font-semibold text-slate-700">
          1.1.8719
        </div>

      </div>
    </footer>
  );
};
