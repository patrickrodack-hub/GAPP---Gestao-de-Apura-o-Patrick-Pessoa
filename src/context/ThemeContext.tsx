import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'solidcon' | 'light' | 'dark' | 'gapp-new';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isSolidcon: boolean;
  isLight: boolean;
  isGappNew: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('apuracao_boi_theme') as Theme | null;
      if (saved === 'solidcon' || saved === 'light' || saved === 'dark' || saved === 'gapp-new') {
        return saved;
      }
      return 'light'; // Mantém o tema atual como padrão ao abrir
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'solidcon', 'gapp-new');
    root.classList.add(theme);
    
    // Also add dark class if theme is dark for tailwind dark variants
    if (theme === 'dark') {
      root.classList.add('dark');
    }

    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('apuracao_boi_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'light') return 'gapp-new';
      if (prev === 'gapp-new') return 'dark';
      if (prev === 'dark') return 'solidcon';
      return 'light';
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        isDark: theme === 'dark', 
        isSolidcon: theme === 'solidcon',
        isLight: theme === 'light',
        isGappNew: theme === 'gapp-new',
        toggleTheme, 
        setTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
