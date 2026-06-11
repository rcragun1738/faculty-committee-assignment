/**
 * Theme Toggle Component
 *
 * A simple button that allows users to switch between dark and light mode.
 * Displays as a sun icon in light mode and moon icon in dark mode.
 *
 * Uses unicode symbols (☀️ and 🌙) for maximum compatibility without
 * requiring an icon library.
 */

import React from 'react';
import { useTheme } from '../hooks/useTheme';

/**
 * Component props (none required for this simple component)
 */
interface ThemeToggleProps {
  // Optional: custom CSS class for styling
  className?: string;
}

/**
 * ThemeToggle Component
 *
 * @param props - Component props
 * @returns Rendered theme toggle button
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      // Click handler to toggle theme
      onClick={toggleTheme}
      // Accessibility: descriptive title for screen readers
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      // Styling: base button styles with hover effects
      className={`
        p-2 rounded-lg transition-colors
        bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-800 dark:text-gray-200
        ${className}
      `}
      // Accessibility: proper button label
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
    >
      {/* Display sun or moon emoji based on current theme */}
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};
