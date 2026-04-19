"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const initTheme = () => {
      setMounted(true);
      try {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setTheme(storedTheme);
        } else {
          setTheme('dark'); // Default to dark theme
        }
      } catch (error) {
        console.warn('Failed to read theme from localStorage:', error);
        setTheme('dark');
      }
    };
    
    initTheme();
  }, []);

  // Apply theme class to document.documentElement
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  // Save theme changes to localStorage
  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [theme, mounted]);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
