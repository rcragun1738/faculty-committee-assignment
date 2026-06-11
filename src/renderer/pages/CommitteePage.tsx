/**
 * Committee Management Page Component
 *
 * This page allows users to:
 * 1. Create new committees (or use defaults from CSV import)
 * 2. Edit committee properties (name, type, description)
 * 3. Set committee type (elected vs appointed)
 * 4. Delete committees
 *
 * For elected committees, users can specify:
 * - Term length (2, 3, 4, or 5 years)
 * - Start and end years
 *
 * This page does NOT manage individual assignments - that happens on AssignmentPage
 */

import React, { useState } from 'react';
import { Committee } from '../../shared/types';
import { AppStateContextValue } from '../hooks/useAppState';
import { v4 as uuidv4 } from 'uuid';

/**
 * Component props
 */
interface CommitteePageProps {
  appState: AppStateContextValue;
  onComplete: () => void;
}

/**
 * CommitteePage Component
 *
 * @param props - Component props
 * @returns Rendered committee page
 */
const CommitteePage: React.FC<CommitteePageProps> = ({ appState, onComplete }) => {
  // Form state for adding new committee
  const [newCommitteeForm, setNewCommitteeForm] = useState({
    name: '',
    type: 'appointed' as 'elected' | 'appointed',
    description: '',
  });

  // Track which committee is being edited
  const [editingCommitteeId, setEditingCommitteeId] = useState<string | null>(null);

  /**
   * Handle adding new committee
   */
  const handleAddCommittee = () => {
    if (!newCommitteeForm.name.trim()) {
      alert('Committee name is required');
      return;
    }

    const newCommittee: Committee = {
      id: `committee-${uuidv4()}`,
      name: newCommitteeForm.name,
      type: newCommitteeForm.type,
      description: newCommitteeForm.description,
      members: [],
    };

    appState.addCommittee(newCommittee);

    // Reset form
    setNewCommitteeForm({
      name: '',
      type: 'appointed',
      description: '',
    });
  };

  /**
   * Handle removing committee
   */
  const handleRemoveCommittee = (committeeId: string) => {
    const committee = appState.state.committees.find((c) => c.id === committeeId);
    if (committee && confirm(`Remove committee "${committee.name}"?`)) {
      appState.removeCommittee(committeeId);
    }
  };

  /**
   * Handle updating committee type
   */
  const handleUpdateType = (committeeId: string, newType: 'elected' | 'appointed') => {
    appState.updateCommittee(committeeId, { type: newType });
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Step 2: Manage Committees
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create committees, set their type (elected/appointed), and manage properties
        </p>
      </div>

      {/* Add Committee Form */}
      <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Add New Committee
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Committee Name"
            value={newCommitteeForm.name}
            onChange={(e) =>
              setNewCommitteeForm({ ...newCommitteeForm, name: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={newCommitteeForm.type}
              onChange={(e) =>
                setNewCommitteeForm({
                  ...newCommitteeForm,
                  type: e.target.value as 'elected' | 'appointed',
                })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="appointed">Appointed</option>
              <option value="elected">Elected</option>
            </select>
            <input
              type="text"
              placeholder="Description (optional)"
              value={newCommitteeForm.description}
              onChange={(e) =>
                setNewCommitteeForm({ ...newCommitteeForm, description: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
          <button
            onClick={handleAddCommittee}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            Add Committee
          </button>
        </div>
      </div>

      {/* Committee List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            All Committees ({appState.state.committees.length})
          </h3>
        </div>

        {appState.state.committees.length === 0 ? (
          <div className="px-6 py-4 text-gray-600 dark:text-gray-400">
            No committees yet. Create one above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {appState.state.committees.map((committee) => (
              <div
                key={committee.id}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {committee.name}
                    </h4>
                    {committee.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {committee.description}
                      </p>
                    )}
                    <div className="mt-2 flex gap-4 items-center">
                      <span
                        className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                          committee.type === 'elected' ? 'bg-purple-600' : 'bg-indigo-600'
                        }`}
                      >
                        {committee.type === 'elected' ? 'Elected' : 'Appointed'}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {committee.members.length} member{committee.members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <select
                      value={committee.type}
                      onChange={(e) =>
                        handleUpdateType(
                          committee.id,
                          e.target.value as 'elected' | 'appointed'
                        )
                      }
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="appointed">Appointed</option>
                      <option value="elected">Elected</option>
                    </select>
                    <button
                      onClick={() => handleRemoveCommittee(committee.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onComplete}
          disabled={appState.state.committees.length === 0}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          Continue to Assignments →
        </button>
      </div>
    </div>
  );
};

export default CommitteePage;
