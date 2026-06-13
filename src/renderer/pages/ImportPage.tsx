/**
 * Import Page Component
 *
 * This page handles:
 * 1. Importing faculty data from Qualtrics CSV file
 * 2. Displaying imported faculty in a table
 * 3. Allowing manual add/edit/delete of faculty
 * 4. Showing statistics about the import
 *
 * The user can:
 * - Click "Import CSV" to select and load their survey results
 * - Add faculty manually who didn't respond to survey
 * - Edit faculty information
 * - Remove faculty (e.g., if deceased or departed)
 */

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Faculty } from '../../shared/types';
import { AppStateContextValue } from '../hooks/useAppState';

/**
 * Component props
 */
interface ImportPageProps {
  // Global app state
  appState: AppStateContextValue;
  // Callback when import is complete and user wants to continue
  onComplete: () => void;
}

/**
 * ImportPage Component
 *
 * @param props - Component props
 * @returns Rendered import page
 */
const ImportPage: React.FC<ImportPageProps> = ({ appState, onComplete }) => {
  // Track whether import is in progress
  const [isImporting, setIsImporting] = useState(false);
  // Track error messages from import
  const [importError, setImportError] = useState<string | null>(null);
  // Track success message
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  // Track which faculty is being edited (null = none)
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
  // Form fields for adding new faculty
  const [newFacultyForm, setNewFacultyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    college: '',
  });
  // Search text used to filter the faculty list below
  const [facultySearch, setFacultySearch] = useState('');
  // Ref to the search box so Ctrl+F can focus it
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Let users press Ctrl+F (or Cmd+F on Mac) to jump to the faculty search box,
   * matching the "find" shortcut they're used to in other programs.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter the faculty list by the search text (matches name, college, or status)
  const query = facultySearch.trim().toLowerCase();
  const filteredFaculty = query
    ? appState.state.faculty.filter((f) => {
        const statusLabel =
          f.optOutStatus === 'wants'
            ? 'wants'
            : f.optOutStatus === 'exempt'
              ? 'exempt'
              : 'opted out';
        const haystack = [
          f.firstName,
          f.lastName,
          `${f.firstName} ${f.lastName}`,
          f.college,
          f.email,
          statusLabel,
          ...f.preferences.map((p) => p.committeeName),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
    : appState.state.faculty;

  /**
   * Handle loading a previous year's project from JSON file
   */
  const handleLoadPreviousYear = async () => {
    try {
      setImportError(null);
      setImportSuccess(null);

      // Call Electron IPC to load JSON file
      const result = await (window as any).electron.loadProject();

      if (!result.success) {
        setImportError(result.error || 'Failed to load project file');
        return;
      }

      if (result.data) {
        // Replace entire app state with loaded project data
        appState.updateState(result.data);

        setImportSuccess(
          `✓ Loaded project from ${result.data.academicYear}. ` +
          `Faculty: ${result.data.faculty.length}, Committees: ${result.data.committees.length}`
        );
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Failed to load project file'
      );
    }
  };

  /**
   * Handle CSV import by calling IPC handler in main process
   */
  const handleImportCsv = async () => {
    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(null);

      // Call Electron IPC to import CSV
      // The preload script exposes (window as any).electron.importCsv()
      const result = await (window as any).electron.importCsv();

      if (!result || result.importedCount === 0) {
        setImportError('No faculty data was found in the selected file');
        return;
      }

      // Add all imported faculty to app state
      result.faculty.forEach((faculty: Faculty) => {
        appState.addFaculty(faculty);
      });

      // Automatically create committees from the survey
      // This saves the user from manually entering all committee names
      result.committees.forEach((committeeName: string) => {
        appState.addCommittee({
          id: `committee-${uuidv4()}`,
          name: committeeName,
          type: 'appointed', // Default to appointed; user can change to elected if needed
          description: '',
          members: [],
        });
      });

      // Show success message with import statistics
      setImportSuccess(
        `Successfully imported ${result.importedCount} faculty members. ` +
          `Created ${result.committees.length} committees.` +
          (result.warnings.length > 0
            ? ` (${result.warnings.length} warnings - see console)`
            : '')
      );

      // Log warnings to console for debugging
      if (result.warnings.length > 0) {
        console.warn('Import warnings:', result.warnings);
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Failed to import CSV file'
      );
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Handle adding a new faculty member manually
   */
  const handleAddFaculty = () => {
    if (!newFacultyForm.firstName || !newFacultyForm.lastName) {
      setImportError('First name and last name are required');
      return;
    }

    const facultyId = `${newFacultyForm.firstName.toLowerCase()}-${newFacultyForm.lastName
      .toLowerCase()
      .replace(/\s+/g, '-')}`;

    const newFaculty: Faculty = {
      id: facultyId,
      firstName: newFacultyForm.firstName,
      lastName: newFacultyForm.lastName,
      email: newFacultyForm.email || 'not@provided.edu',
      college: newFacultyForm.college || 'Unknown',
      optOutStatus: 'wants',
      optOutReason: '',
      preferences: [],
      comments: 'Added manually (not from survey)',
    };

    appState.addFaculty(newFaculty);
    setImportSuccess(`Added faculty: ${newFaculty.firstName} ${newFaculty.lastName}`);
    setNewFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      college: '',
    });
  };

  /**
   * Handle removing faculty
   */
  const handleRemoveFaculty = (facultyId: string) => {
    const faculty = appState.getFacultyById(facultyId);
    if (faculty && confirm(`Remove ${faculty.firstName} ${faculty.lastName}?`)) {
      appState.removeFaculty(facultyId);
      setImportSuccess(`Removed ${faculty.firstName} ${faculty.lastName}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Step 1: Import Faculty
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Import your Qualtrics survey results or manually add faculty members
        </p>
      </div>

      {/* Import Options Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Import CSV */}
        <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Import from Qualtrics CSV
          </h3>
          <button
            onClick={handleImportCsv}
            disabled={isImporting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            {isImporting ? 'Importing...' : 'Select CSV File'}
          </button>
        </div>

        {/* Load Previous Year */}
        <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg border-2 border-green-200 dark:border-green-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Load Previous Year's Project
          </h3>
          <button
            onClick={handleLoadPreviousYear}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Select JSON File
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Load committee and assignment data from a previous academic year
          </p>
        </div>
      </div>

      {/* Error message */}
      {importError && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded">
          {importError}
        </div>
      )}

      {/* Success message */}
      {importSuccess && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-100 px-4 py-3 rounded">
          {importSuccess}
        </div>
      )}

      {/* Add Faculty Manually */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Add Faculty Manually
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="First Name"
            value={newFacultyForm.firstName}
            onChange={(e) =>
              setNewFacultyForm({ ...newFacultyForm, firstName: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={newFacultyForm.lastName}
            onChange={(e) =>
              setNewFacultyForm({ ...newFacultyForm, lastName: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <input
            type="email"
            placeholder="Email"
            value={newFacultyForm.email}
            onChange={(e) =>
              setNewFacultyForm({ ...newFacultyForm, email: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="College"
            value={newFacultyForm.college}
            onChange={(e) =>
              setNewFacultyForm({ ...newFacultyForm, college: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
        </div>
        <button
          onClick={handleAddFaculty}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
        >
          Add Faculty
        </button>
      </div>

      {/* Faculty List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Faculty List ({query ? `${filteredFaculty.length} of ${appState.state.faculty.length}` : appState.state.faculty.length})
            </h3>
            <div className="relative w-full sm:w-72">
              <input
                ref={searchInputRef}
                type="text"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search faculty (Ctrl+F)"
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white"
              />
              {facultySearch && (
                <button
                  onClick={() => setFacultySearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {appState.state.faculty.length === 0 ? (
          <div className="px-6 py-4 text-gray-600 dark:text-gray-400">
            No faculty imported yet. Import a CSV file or add faculty manually.
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="px-6 py-4 text-gray-600 dark:text-gray-400">
            No faculty match "{facultySearch}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Preferences
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredFaculty.map((faculty, idx) => (
                  <tr
                    key={faculty.id}
                    className={idx % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800'}
                  >
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {faculty.firstName} {faculty.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {faculty.college}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                          faculty.optOutStatus === 'wants'
                            ? 'bg-green-600'
                            : faculty.optOutStatus === 'exempt'
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                        }`}
                      >
                        {faculty.optOutStatus === 'wants'
                          ? 'Wants'
                          : faculty.optOutStatus === 'exempt'
                            ? 'Exempt'
                            : 'Opted Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                      {faculty.preferences.length > 0
                        ? faculty.preferences.map((p) => p.committeeName).join(', ')
                        : 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleRemoveFaculty(faculty.id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={appState.state.faculty.length === 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          Continue to Committees →
        </button>
      </div>
    </div>
  );
};

export default ImportPage;
