/**
 * Theme Hook for Dark/Light Mode Support
 *
 * This hook manages the application's theme preference (dark or light mode).
 * It:
 * - Stores preference in browser localStorage for persistence
 * - Applies theme by adding 'dark' class to HTML element
 * - Works with Tailwind CSS dark mode (dark: prefix)
 * - Respects system preference as fallback
 *
 * Usage in a component:
 *   const { isDark, toggleTheme } = useTheme();
 *   return <button onClick={toggleTheme}>Toggle Dark Mode</button>
 */

import { useState, useEffect } from 'react';

/**
 * Hook return type
 */
export interface ThemeContextValue {
  // Whether dark mode is currently enabled
  isDark: boolean;
  // Function to toggle between dark and light mode
  toggleTheme: () => void;
  // Set theme to specific value
  setTheme: (isDark: boolean) => void;
}

/**
 * Custom hook for managing theme
 *
 * localStorage key used: 'theme-preference'
 * HTML class used: 'dark' (Tailwind's dark mode class)
 *
 * @returns Theme state and functions to control it
 */
export function useTheme(): ThemeContextValue {
  // Track whether dark mode is currently active
  const [isDark, setIsDark] = useState<boolean>(() => {
    // On initial load, check localStorage
    if (typeof window === 'undefined') return false; // SSR safety

    const stored = localStorage.getItem('theme-preference');

    // If user has a preference saved, use it
    if (stored === 'dark' || stored === 'light') {
      return stored === 'dark';
    }

    // Otherwise, check system preference
    // This respects the user's OS dark mode setting
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }

    // Default to light mode if no preference found
    return false;
  });

  // Apply theme changes to the DOM and localStorage
  useEffect(() => {
    // Get the HTML element
    const html = document.documentElement;

    if (isDark) {
      // Enable dark mode by adding 'dark' class
      // Tailwind CSS uses this class to apply dark mode styles
      html.classList.add('dark');
      // Store preference in localStorage
      localStorage.setItem('theme-preference', 'dark');
    } else {
      // Disable dark mode by removing 'dark' class
      html.classList.remove('dark');
      // Store preference in localStorage
      localStorage.setItem('theme-preference', 'light');
    }
  }, [isDark]);

  /**
   * Toggle between dark and light mode
   */
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  /**
   * Set theme to specific value
   */
  const setTheme = (newIsDark: boolean) => {
    setIsDark(newIsDark);
  };

  return {
    isDark,
    toggleTheme,
    setTheme,
  };
}
