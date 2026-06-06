'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isHydrated: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Inline script to inject into <head> BEFORE React hydration.
 * This prevents the flash-of-wrong-theme (FOWT) problem in Next.js.
 * It reads localStorage + system preference and sets data-theme on <html>.
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('kvo-theme');
    var theme = stored || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isHydrated, setIsHydrated] = useState(false);

  // On mount, read from DOM attribute (set by inline script) or localStorage
  useEffect(() => {
    const domTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
    const stored = localStorage.getItem('kvo-theme') as Theme | null;

    const resolved: Theme = domTheme || stored || 'light';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    setIsHydrated(true);
  }, []);

  // Removed system preference listener to stick to manual toggle or light default


  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('kvo-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isHydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}
