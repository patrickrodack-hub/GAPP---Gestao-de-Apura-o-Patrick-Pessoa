import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'full' | 'solidcon-toolbar';
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ variant = 'full' }) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { id: Theme; name: string; subtitle: string; icon: any; color: string; badge: string }[] = [
    {
      id: 'solidcon',
      name: 'GAPP Classic',
      subtitle: 'Layout Desktop Comercial com fundo metálico e barra azul clássica',
      icon: Monitor,
      color: 'bg-blue-600 text-white',
      badge: 'Classic'
    },
    {
      id: 'light',
      name: 'Moderno Claro',
      subtitle: 'Interface web limpa, luminosa e minimalista',
      icon: Sun,
      color: 'bg-amber-500 text-white',
      badge: 'Clean'
    },
    {
      id: 'dark',
      name: 'Moderno Escuro',
      subtitle: 'Interface executiva em tons de ardósia para baixa luminosidade',
      icon: Moon,
      color: 'bg-indigo-600 text-white',
      badge: 'Dark'
    }
  ];

  const currentThemeObj = themes.find(t => t.id === theme) || themes[0];
  const CurrentIcon = currentThemeObj.icon;

  if (variant === 'solidcon-toolbar') {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gradient-to-b from-[#f9fafb] to-[#e5e7eb] hover:from-[#ffffff] hover:to-[#d1d5db] border border-[#9ca3af] active:border-[#6b7280] shadow-sm text-[11px] font-sans font-medium text-slate-800 transition"
          title="Alternar Tema do Sistema (GAPP Classic, Claro ou Escuro)"
        >
          <div className="w-3.5 h-3.5 rounded bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
            G
          </div>
          <span className="font-semibold text-slate-900">Tema:</span>
          <span className="text-blue-700 font-bold">{currentThemeObj.name}</span>
          <span className="text-[9px] text-slate-500">▼</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-64 bg-white border border-[#9ca3af] shadow-2xl rounded-md z-50 p-1.5 text-xs animate-scale-in font-sans">
            <div className="px-2 py-1 border-b border-slate-200 font-bold text-slate-700 text-[11px] uppercase tracking-wide flex items-center justify-between">
              <span>Selecione o Tema</span>
              <span className="text-[10px] text-slate-500 font-normal">v10.1</span>
            </div>
            <div className="mt-1 space-y-1">
              {themes.map(t => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded text-left transition ${
                      isSelected ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded ${t.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="text-xs font-bold leading-tight">{t.name}</div>
                        <div className="text-[10px] text-slate-500">{t.badge}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-7.5 w-7.5 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          title={`Tema Visual: ${currentThemeObj.name} (Clique para alternar)`}
          aria-label="Alternar tema visual"
        >
          <CurrentIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl z-50 p-2 text-xs animate-scale-in text-slate-900 dark:text-white">
            <div className="px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>Alternar Tema Visual</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">ERP Boi</span>
            </div>

            <div className="mt-1.5 space-y-1">
              {themes.map(t => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start justify-between p-2.5 rounded-lg text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`p-1.5 rounded-md ${t.color} shrink-0 mt-0.5`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {t.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {t.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
        title="Trocar tema da aplicação (GAPP Classic, Claro ou Escuro)"
        aria-label="Trocar tema"
      >
        <CurrentIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        <span className="hidden sm:inline">Tema:</span>
        <span className="font-bold text-amber-700 dark:text-amber-300">{currentThemeObj.name}</span>
        <span className="text-[9px] text-slate-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl z-50 p-2 text-xs animate-scale-in text-slate-900 dark:text-white">
          <div className="px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider flex items-center justify-between">
            <span>Alternar Tema Visual</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">ERP Boi</span>
          </div>

          <div className="mt-1.5 space-y-1">
            {themes.map(t => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start justify-between p-2.5 rounded-lg text-left transition ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-slate-900 dark:text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`p-1.5 rounded-md ${t.color} shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {t.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {t.subtitle}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
