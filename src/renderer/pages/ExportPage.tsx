/**
 * Export and Save Page Component
 *
 * This final page allows users to:
 * 1. Export assignments to Excel for printing and sharing
 * 2. Save the project as JSON for next year's starting point
 * 3. Review summary statistics before finalizing
 */

import React, { useState } from 'react';
import { AppStateContextValue } from '../hooks/useAppState';

/**
 * Component props
 */
interface ExportPageProps {
  appState: AppStateContextValue;
}

/**
 * ExportPage Component
 */
const ExportPage: React.FC<ExportPageProps> = ({ appState }) => {
  // Track export status
  const [exportStatus, setExportStatus] = useState<{
    type: 'idle' | 'exporting' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });

  // How committee sheets should be ordered in the exported workbook
  const [sheetOrder, setSheetOrder] = useState<'as-listed' | 'alphabetical' | 'by-type'>(
    'as-listed'
  );

  /**
   * Handle Excel export
   */
  const handleExportExcel = async () => {
    try {
      setExportStatus({ type: 'exporting' });

      // Call IPC handler to export to Excel
      const result = await (window as any).electron.exportExcel(appState.state, sheetOrder);

      if (result.success) {
        setExportStatus({
          type: 'success',
          message: `✓ Excel file exported successfully to ${result.filePath}`,
        });
      } else {
        setExportStatus({
          type: 'error',
          message: `✗ Export failed: ${result.error}`,
        });
      }
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Export failed',
      });
    }
  };

  /**
   * Handle saving project as JSON
   */
  const handleSaveProject = async () => {
    try {
      setExportStatus({ type: 'exporting' });

      // Call IPC handler to save project
      const result = await (window as any).electron.saveProject(appState.state);

      if (result.success) {
        setExportStatus({
          type: 'success',
          message: `✓ Project saved successfully to ${result.filePath}`,
        });
      } else {
        setExportStatus({
          type: 'error',
          message: `✗ Save failed: ${result.error}`,
        });
      }
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Save failed',
      });
    }
  };

  /**
   * Calculate statistics for summary
   */
  const stats = {
    totalFaculty: appState.state.faculty.length,
    wantingAssignment: appState.state.faculty.filter((f) => f.optOutStatus === 'wants').length,
    assigned: new Set(
      appState.state.committees.flatMap((c) => c.members.map((m) => m.facultyId))
    ).size,
    totalCommittees: appState.state.committees.length,
    openPositions: appState.state.committees.reduce(
      (sum, c) => sum + (c.members.length > 0 ? 0 : 1),
      0
    ),
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Step 4: Export and Save
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Generate output files and save your work for next year
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
            {stats.totalFaculty}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Faculty</div>
        </div>

        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-3xl font-bold text-green-600 dark:text-green-300">
            {stats.assigned}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Assigned</div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">
            {stats.wantingAssignment - stats.assigned}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Unassigned</div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-300">
            {stats.totalCommittees}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Committees</div>
        </div>

        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-700">
          <div className="text-3xl font-bold text-red-600 dark:text-red-300">
            {stats.openPositions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Empty</div>
        </div>
      </div>

      {/* Export to Excel */}
      <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Export to Excel
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Generate a professional Excel workbook with one sheet per committee, summary sheet, and
          faculty list. Perfect for printing and distribution to faculty.
        </p>
        <div className="mb-4 max-w-md">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Sheet order
          </label>
          <select
            value={sheetOrder}
            onChange={(e) => setSheetOrder(e.target.value as typeof sheetOrder)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
          >
            <option value="as-listed">As listed (creation order)</option>
            <option value="alphabetical">Alphabetical (A–Z)</option>
            <option value="by-type">By type (elected first, then appointed)</option>
          </select>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={exportStatus.type === 'exporting'}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          {exportStatus.type === 'exporting' ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {/* Save Project */}
      <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg border-2 border-green-200 dark:border-green-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Save Project
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Save this year's assignments as a JSON file. Load it next year as a starting point for
          committee assignments.
        </p>
        <button
          onClick={handleSaveProject}
          disabled={exportStatus.type === 'exporting'}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          {exportStatus.type === 'exporting' ? 'Saving...' : 'Save Project'}
        </button>
      </div>

      {/* Status Message */}
      {exportStatus.type === 'success' && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-100 px-4 py-3 rounded">
          {exportStatus.message}
        </div>
      )}

      {exportStatus.type === 'error' && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded">
          {exportStatus.message}
        </div>
      )}

      {/* Faculty Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Committee Assignments Summary
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {appState.state.committees.map((committee) => (
            <div key={committee.id} className="px-6 py-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {committee.name}
                </h4>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {committee.members.length} member{committee.members.length !== 1 ? 's' : ''}
                </span>
              </div>

              {committee.members.length === 0 ? (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠ No members assigned yet
                </p>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {committee.members
                    .map((m) => {
                      const faculty = appState.getFacultyById(m.facultyId);
                      const rolelabel =
                        m.role.toLowerCase() === 'member' ? '' : ` (${m.role})`;
                      return `${faculty?.firstName} ${faculty?.lastName}${rolelabel}`;
                    })
                    .join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Tip:</strong> After exporting to Excel, you can open the file, make any final
          edits, and print or convert it to PDF for faculty distribution. Save the project file
          regularly as you work.
        </p>
      </div>
    </div>
  );
};

export default ExportPage;
