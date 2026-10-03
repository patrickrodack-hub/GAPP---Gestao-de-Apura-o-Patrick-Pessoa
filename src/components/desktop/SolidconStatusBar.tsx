import React, { useState, useEffect } from 'react';

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
      className="h-6 sm:h-7 px-2.5 flex items-center justify-between text-[11px] font-sans text-slate-800 bg-[#e0e0e0] border-t border-[#b0bec5] z-30 select-none shadow-inner"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)'
      }}
    >
      {/* Left items: Connection & State */}
      <div className="flex items-center space-x-2 sm:space-x-4 overflow-hidden">
        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">ONLINE •</span>
          <span>MATRIZ ({storeCount} Filiais)</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-600 font-mono text-[10px] border-l border-slate-300 pl-3">
          <span className={isCloudConnected ? "text-emerald-700 font-semibold flex items-center gap-1" : "text-amber-700"}>
            <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {isCloudConnected ? 'BD NUVEM (FIRESTORE)' : 'BD LOCAL ATIVO'}
          </span>
          <span>•</span>
          <span>GRUPO GAPP SISTEMAS v10.1</span>
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
