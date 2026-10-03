import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'solidcon' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isSolidcon: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('apuracao_boi_theme') as Theme | null;
      if (saved === 'solidcon' || saved === 'light' || saved === 'dark') return saved;
      return 'solidcon'; // Default to the requested Solidcon theme!
    } catch {
      return 'solidcon';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'solidcon');
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
      if (prev === 'solidcon') return 'light';
      if (prev === 'light') return 'dark';
      return 'solidcon';
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

