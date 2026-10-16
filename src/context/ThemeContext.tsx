import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

const THEME_STORAGE_KEY = 'apuracao_boi_theme';

const applyThemeToDOM = (targetTheme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark', 'light', 'solidcon', 'gapp-new');
  root.classList.add(targetTheme);

  // Tailwind dark mode variant support
  if (targetTheme === 'dark') {
    root.classList.add('dark');
  }

  root.setAttribute('data-theme', targetTheme);

  // Meta theme-color for mobile status bar and PWA title bar
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    if (targetTheme === 'gapp-new') {
      metaThemeColor.setAttribute('content', '#113829');
    } else if (targetTheme === 'dark') {
      metaThemeColor.setAttribute('content', '#07080c');
    } else if (targetTheme === 'solidcon') {
      metaThemeColor.setAttribute('content', '#1b3252');
    } else {
      metaThemeColor.setAttribute('content', '#ffffff');
    }
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved === 'solidcon' || saved === 'light' || saved === 'dark' || saved === 'gapp-new') {
        applyThemeToDOM(saved);
        return saved;
      }
      applyThemeToDOM('gapp-new');
      return 'gapp-new';
    } catch {
      applyThemeToDOM('gapp-new');
      return 'gapp-new';
    }
  });

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Não foi possível gravar o tema no localStorage:', e);
    }
    applyThemeToDOM(newTheme);
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      let next: Theme;
      if (prev === 'gapp-new') next = 'light';
      else if (prev === 'light') next = 'dark';
      else if (prev === 'dark') next = 'solidcon';
      else next = 'gapp-new';

      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      applyThemeToDOM(next);
      return next;
    });
  }, []);

  useEffect(() => {
    // Sincroniza o DOM imediatamente na montagem e garante persistência
    applyThemeToDOM(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}

    // Sincronização multi-aba: quando o tema for alterado em outra janela/aba, atualiza esta
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const remoteTheme = e.newValue as Theme;
        if (
          remoteTheme === 'solidcon' ||
          remoteTheme === 'light' ||
          remoteTheme === 'dark' ||
          remoteTheme === 'gapp-new'
        ) {
          applyThemeToDOM(remoteTheme);
          setThemeState(remoteTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme]);

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
