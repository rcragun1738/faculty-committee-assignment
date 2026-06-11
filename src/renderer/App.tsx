/**
 * Main Application Component
 *
 * This is the root component of the React application.
 * It manages:
 * - Overall layout (header, navigation, main content)
 * - Page routing/navigation between different views
 * - Global state (faculty, committees, assignments)
 * - Theme (dark/light mode)
 *
 * The app has three main pages:
 * 1. Import - Load CSV and manage faculty
 * 2. Committees - Create/edit committees
 * 3. Assignments - Drag-and-drop faculty to committees
 * 4. Export - Generate output files and save project
 */

import React, { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { useTheme } from './hooks/useTheme';
import { ThemeToggle } from './components/ThemeToggle';
import ImportPage from './pages/ImportPage';
import CommitteePage from './pages/CommitteePage';
import AssignmentPage from './pages/AssignmentPage';
import ExportPage from './pages/ExportPage';

/**
 * Type for page navigation
 * Defines which page is currently displayed
 */
type PageName = 'import' | 'committees' | 'assignments' | 'export';

/**
 * App Component
 *
 * Main entry point for the React application. Renders the header with navigation
 * and theme toggle, then the selected page based on current navigation state.
 */
const App: React.FC = () => {
  // Global state management for all faculty and committee data
  const appState = useAppState();

  // Theme management for dark/light mode
  useTheme();

  // Track which page is currently displayed
  const [currentPage, setCurrentPage] = useState<PageName>('import');

  /**
   * Navigate to a different page
   * @param page - The page to navigate to
   */
  const goToPage = (page: PageName) => {
    setCurrentPage(page);
  };

  /**
   * Get CSS classes for navigation buttons
   * Active button gets highlighted styling
   */
  const getButtonClass = (pageName: PageName) => `
    px-4 py-2 rounded-lg transition-colors
    ${
      currentPage === pageName
        ? 'bg-blue-600 text-white' // Active: blue background
        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600' // Inactive
    }
  `;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* ======================== HEADER ======================== */}
      <header className="bg-blue-700 dark:bg-blue-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* App title */}
          <h1 className="text-2xl font-bold">Faculty Committee Assignment Tool</h1>

          {/* Theme toggle button */}
          <ThemeToggle className="ml-4" />
        </div>
      </header>

      {/* ======================== NAVIGATION ======================== */}
      <nav className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex gap-2 flex-wrap">
          <button onClick={() => goToPage('import')} className={getButtonClass('import')}>
            1. Import Faculty
          </button>
          <button onClick={() => goToPage('committees')} className={getButtonClass('committees')}>
            2. Manage Committees
          </button>
          <button onClick={() => goToPage('assignments')} className={getButtonClass('assignments')}>
            3. Assign Faculty
          </button>
          <button onClick={() => goToPage('export')} className={getButtonClass('export')}>
            4. Export & Save
          </button>
        </div>
      </nav>

      {/* ======================== MAIN CONTENT ======================== */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Render different page based on currentPage state */}

          {currentPage === 'import' && (
            <ImportPage
              appState={appState}
              onComplete={() => goToPage('committees')}
            />
          )}

          {currentPage === 'committees' && (
            <CommitteePage
              appState={appState}
              onComplete={() => goToPage('assignments')}
            />
          )}

          {currentPage === 'assignments' && (
            <AssignmentPage
              appState={appState}
              onComplete={() => goToPage('export')}
            />
          )}

          {currentPage === 'export' && (
            <ExportPage appState={appState} />
          )}
        </div>
      </main>

      {/* ======================== FOOTER ======================== */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        <p>
          Academic Year: <strong>{appState.state.academicYear}</strong> • Last Modified:{' '}
          <strong>{new Date(appState.state.metadata.lastModified).toLocaleDateString()}</strong>
        </p>
      </footer>
    </div>
  );
};

export default App;
