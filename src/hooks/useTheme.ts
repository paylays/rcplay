/**
 * useTheme.ts
 * Manages light/dark mode — persists to localStorage, sets data-theme on <html>
 */
import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'toefl_theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    // Respect OS preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  } catch (_) {}
  return 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Apply on mount too
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, toggle };
}
