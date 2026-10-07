import React from 'react';
import { NavigationTab } from '../Navigation';
import { 
  FileSpreadsheet, 
  Scissors, 
  Warehouse, 
  DollarSign, 
  ShoppingCart, 
  Bone, 
  SlidersHorizontal,
  LayoutDashboard,
  Cloud,
  Smartphone,
  Activity
} from 'lucide-react';

interface SolidconDesktopWallpaperProps {
  onOpenTab: (tab: NavigationTab) => void;
  onOpenQuickCalc: () => void;
}

export const SolidconDesktopWallpaper: React.FC<SolidconDesktopWallpaperProps> = ({
  onOpenTab,
  onOpenQuickCalc,
}) => {
  const desktopShortcuts = [
    { id: 'sheet', label: 'Planilha Direção v10.6', icon: FileSpreadsheet, color: 'bg-emerald-600 text-white' },
    { id: 'dashboard', label: 'Painel Geral de Gestão', icon: LayoutDashboard, color: 'bg-blue-600 text-white' },
    { id: 'quotes', label: 'Cotação em Tempo Real', icon: Activity, color: 'bg-emerald-700 text-white' },
    { id: 'yield', label: 'Rendimento & Desossa', icon: Scissors, color: 'bg-amber-600 text-white' },
    { id: 'results', label: 'DRE & Margens', icon: DollarSign, color: 'bg-indigo-600 text-white' },
    { id: 'inventory', label: 'Câmaras Frias & Estoque', icon: Warehouse, color: 'bg-cyan-600 text-white' },
    { id: 'purchases', label: 'Lotes de Frigoríficos', icon: ShoppingCart, color: 'bg-purple-600 text-white' },
    { id: 'waste', label: 'Descarte (Sebo e Osso)', icon: Bone, color: 'bg-rose-600 text-white' },
    { id: 'devices', label: 'Aparelhos Conectados', icon: Smartphone, color: 'bg-teal-600 text-white' },
    { id: 'parameters', label: 'Módulo 1 - Parâmetros', icon: SlidersHorizontal, color: 'bg-slate-700 text-white' },
    { id: 'backup', label: 'Backup Online Nuvem', icon: Cloud, color: 'bg-sky-600 text-white' },
  ];

  return (
    <div className="relative w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-6 overflow-hidden select-none">
      {/* High-fidelity Brushed Metal Wall Surface */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 30% 25%, rgba(220, 226, 235, 0.95) 0%, rgba(160, 168, 178, 0.9) 45%, rgba(98, 106, 117, 0.98) 85%, rgba(65, 72, 82, 1) 100%),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px)
          `,
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.45)'
        }}
      />

      {/* Subtle Studio Spotlight Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.35) 100%)'
        }}
      />

      {/* Desktop Quick Shortcuts (Top Left) */}
      <div className="absolute top-4 left-4 sm:left-6 z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md max-h-[75vh] overflow-y-auto pr-1">
        {desktopShortcuts.map((sc) => {
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={() => onOpenTab(sc.id as NavigationTab)}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-white/30 hover:bg-white/50 border border-white/40 backdrop-blur-sm shadow-sm hover:shadow transition text-left group cursor-pointer"
            >
              <div className={`p-1.5 rounded ${sc.color} shadow-xs group-hover:scale-105 transition`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 tracking-tight drop-shadow-xs">
                {sc.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Center 3D Embossed Metallic Logo & Branding */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto py-12 px-4">
        
        {/* The 3D Chrome Emblem Matching the Uploaded Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4">
          
          {/* Rounded Square Beveled Metallic Badge from the uploaded image */}
          <div 
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center relative shadow-2xl shrink-0"
            style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #d5dae2 35%, #9ea8b5 70%, #687282 100%)',
              boxShadow: `
                0 20px 35px -5px rgba(0, 0, 0, 0.45),
                0 10px 15px -3px rgba(0, 0, 0, 0.3),
                inset 2px 2px 3px rgba(255, 255, 255, 0.95),
                inset -2px -2px 5px rgba(0, 0, 0, 0.45)
              `,
              border: '1px solid rgba(255, 255, 255, 0.8)'
            }}
          >
            {/* Inner bevel layer */}
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #edf1f7 0%, #cbd3de 50%, #9ba6b4 100%)',
                boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.8), inset -1px -1px 3px rgba(0,0,0,0.3)'
              }}
            >
              {/* Bold Dark Embossed 'G' Monogram */}
              <div 
                className="text-5xl sm:text-6xl font-black font-sans tracking-tighter"
                style={{
                  color: '#242a33',
                  textShadow: `
                    1px 1px 0px rgba(255,255,255,0.9),
                    -1px -1px 0px rgba(0,0,0,0.8),
                    2px 3px 5px rgba(0,0,0,0.5)
                  `
                }}
              >
                G
              </div>

              {/* Gloss reflection shine */}
              <div 
                className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              />
            </div>
          </div>

          {/* Chrome Typography: Grupo GAPP / SISTEMAS matching the uploaded image */}
          <div className="text-left flex flex-col justify-center">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none"
              style={{
                fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
                color: '#d4dae0',
                background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 30%, #8391a3 70%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(3px 4px 5px rgba(0,0,0,0.55)) drop-shadow(-1px -1px 1px rgba(255,255,255,0.8))',
              }}
            >
              Grupo GAPP
            </h1>
            <span 
              className="text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.35em] mt-0.5 sm:mt-1 uppercase"
              style={{
                color: '#94a3b8',
                background: 'linear-gradient(180deg, #f1f5f9 0%, #94a3b8 50%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.5))'
              }}
            >
              SISTEMAS
            </span>
          </div>

        </div>

        {/* Brushed Metal Plaque with GAPP and System Name */}
        <div 
          className="mt-6 px-6 py-3 rounded-xl border border-white/40 shadow-xl backdrop-blur-md max-w-xl text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(220,226,235,0.25) 100%)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.8)'
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              GRUPO GAPP SISTEMAS • GESTÃO APURAÇÃO DO BOI
            </span>
            <span className="text-[10px] px-2 py-0.2 rounded font-bold bg-amber-500/30 text-amber-950 border border-amber-500/50">
              OFICIAL
            </span>
          </div>
          <p className="text-[11px] text-slate-700 font-medium">
            Gestão Operacional de Compra, Desossa, Rendimento e Câmaras Frias por <strong>Patrick Pessoa</strong>
          </p>
          <div className="mt-2 text-[10px] text-slate-600 font-mono flex items-center justify-center gap-3">
            <span>Matriz Oficial: <strong>v10.6</strong></span>
            <span>•</span>
            <span>16 Lojas Interligadas</span>
            <span>•</span>
            <span>Build 1.6.0106</span>
          </div>
        </div>

        {/* Action button to open matrix spreadsheet */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onOpenTab('sheet')}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-b from-[#0078d7] to-[#005a9e] hover:from-[#0086f0] hover:to-[#0067b8] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 border border-blue-400 active:scale-95 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Abrir Planilha de Compra da Direção v10.6</span>
          </button>

          <button
            onClick={onOpenQuickCalc}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#f3f4f6] to-[#d1d5db] hover:from-[#ffffff] hover:to-[#e5e7eb] text-slate-800 text-xs font-bold flex items-center gap-2 shadow-md border border-[#9ca3af] active:scale-95 transition"
          >
            <Scissors className="w-4 h-4 text-amber-700" />
            <span>Apuração Rápida de Desossa</span>
          </button>
        </div>

      </div>

      {/* Watermark in corner */}
      <div className="absolute bottom-3 right-4 z-10 text-[10px] font-mono text-slate-700/80">
        Grupo GAPP Sistemas • Gestão Apuração do Boi v10.6 (Build Oficial 1.6.0106)
      </div>
    </div>
  );
};
