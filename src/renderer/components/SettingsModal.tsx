/**
 * Settings Modal
 *
 * A dialog (opened from the gear icon in the header) for editing project-level
 * settings. Currently supports two sections:
 *  - Years of service: the term-year options shown in the assignment "Edit" menu
 *  - Roles: the committee roles available when assigning members
 *
 * Settings are saved inside the project file, so each year's project keeps its
 * own configuration. Changes here apply when the user clicks Save.
 */

import React, { useState } from 'react';
import { ProjectSettings } from '../../shared/types';

interface SettingsModalProps {
  settings: ProjectSettings;
  onSave: (updates: Partial<ProjectSettings>) => void;
  onClose: () => void;
}

/** Capitalize a role for display, e.g. 'ex-officio' -> 'Ex-Officio'. */
function displayRole(role: string): string {
  return role
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  // Local working copies so edits only apply when the user clicks Save
  const [serviceYears, setServiceYears] = useState<number[]>(settings.serviceYears);
  const [roles, setRoles] = useState<string[]>(settings.roles);

  // Inputs for adding a new year / role
  const [newYear, setNewYear] = useState<string>(String(new Date().getFullYear()));
  const [newRole, setNewRole] = useState<string>('');

  const addYear = () => {
    const year = parseInt(newYear, 10);
    if (!Number.isFinite(year)) return;
    if (serviceYears.includes(year)) return;
    setServiceYears([...serviceYears, year].sort((a, b) => a - b));
  };

  const removeYear = (year: number) => {
    setServiceYears(serviceYears.filter((y) => y !== year));
  };

  const addRole = () => {
    const role = newRole.trim().toLowerCase();
    if (!role) return;
    if (roles.includes(role)) return;
    setRoles([...roles, role]);
    setNewRole('');
  };

  const removeRole = (role: string) => {
    setRoles(roles.filter((r) => r !== role));
  };

  const handleSave = () => {
    onSave({ serviceYears, roles });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h3>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* ===== Years of Service ===== */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Years of Service
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            These appear as term start/end choices when editing a committee assignment.
            Each year shows as an academic year (e.g. 2025 = 2025-2026).
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {serviceYears.length === 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">No years added.</span>
            )}
            {serviceYears.map((year) => (
              <span
                key={year}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
              >
                {year}-{year + 1}
                <button
                  onClick={() => removeYear(year)}
                  aria-label={`Remove ${year}-${year + 1}`}
                  className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-100"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addYear()}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
              placeholder="e.g. 2025"
            />
            <button
              onClick={addYear}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
            >
              Add Year
            </button>
          </div>
        </section>

        {/* ===== Roles ===== */}
        <section className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Committee Roles
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            These are the roles you can give a committee member. "Chair" and "Secretary"
            are also used to fill those columns on the Excel summary sheet.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {roles.length === 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">No roles added.</span>
            )}
            {roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm"
              >
                {displayRole(role)}
                <button
                  onClick={() => removeRole(role)}
                  aria-label={`Remove ${displayRole(role)}`}
                  className="text-green-600 hover:text-green-800 dark:hover:text-green-100"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRole()}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
              placeholder="e.g. Co-Chair"
            />
            <button
              onClick={addRole}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
            >
              Add Role
            </button>
          </div>
        </section>

        {/* ===== Actions ===== */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
