/**
 * Faculty to Committee Assignment Page
 *
 * This page allows users to assign faculty members to committees.
 * Features:
 * 1. Lists unassigned faculty on the left
 * 2. Lists committees on the right
 * 3. Click faculty → click committee to assign
 * 4. Edit member roles and term dates
 * 5. Remove faculty from committees
 *
 * Note: Full drag-and-drop is implemented in phase 2.
 * This version uses click-based assignment for simplicity.
 */

import React, { useState } from 'react';
import { Committee, CommitteeMember } from '../../shared/types';
import { AppStateContextValue } from '../hooks/useAppState';

/**
 * Component props
 */
interface AssignmentPageProps {
  appState: AppStateContextValue;
  onComplete: () => void;
}

/**
 * Modal for editing member details
 */
interface EditMemberModalProps {
  committee: Committee;
  member: CommitteeMember;
  onSave: (updates: Partial<CommitteeMember>) => void;
  onClose: () => void;
}

/**
 * EditMemberModal Component
 * Allows editing role and term dates for assigned members
 */
const EditMemberModal: React.FC<EditMemberModalProps> = ({
  committee,
  member,
  onSave,
  onClose,
}) => {
  const [role, setRole] = useState<CommitteeMember['role']>(member.role);
  const [termStart, setTermStart] = useState(member.termStart || 2026);
  const [termEnd, setTermEnd] = useState(member.termEnd || 2027);

  const handleSave = () => {
    onSave({
      role,
      termStart: committee.type === 'elected' ? termStart : undefined,
      termEnd: committee.type === 'elected' ? termEnd : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Edit Committee Member
        </h3>

        <div className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CommitteeMember['role'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="member">Regular Member</option>
              <option value="chair">Chair</option>
              <option value="secretary">Secretary</option>
              <option value="ex-officio">Ex-Officio</option>
            </select>
          </div>

          {/* Term Dates (only for elected committees) */}
          {committee.type === 'elected' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Term Start Year
                </label>
                <select
                  value={termStart}
                  onChange={(e) => setTermStart(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {Array.from({ length: 10 }, (_, i) => 2026 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}-{year + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Term End Year
                </label>
                <select
                  value={termEnd}
                  onChange={(e) => setTermEnd(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {Array.from({ length: 10 }, (_, i) => 2026 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}-{year + 1}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6 justify-end">
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * AssignmentPage Component
 */
const AssignmentPage: React.FC<AssignmentPageProps> = ({ appState, onComplete }) => {
  // Track selected faculty for assignment
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  // Track which member is being edited
  const [editingMember, setEditingMember] = useState<{
    committeeId: string;
    member: CommitteeMember;
  } | null>(null);

  // Get unassigned faculty
  const unassignedFaculty = appState.getUnassignedFaculty();

  /**
   * Handle assigning faculty to committee
   */
  const handleAssignToCommittee = (committeeId: string) => {
    if (!selectedFacultyId) return;

    appState.addMemberToCommittee(committeeId, selectedFacultyId, 'member');
    setSelectedFacultyId(null);
  };

  /**
   * Handle removing faculty from committee
   */
  const handleRemoveFromCommittee = (committeeId: string, facultyId: string) => {
    appState.removeMemberFromCommittee(committeeId, facultyId);
  };

  /**
   * Handle updating member info
   */
  const handleUpdateMember = (
    committeeId: string,
    updates: Partial<CommitteeMember>
  ) => {
    if (!editingMember) return;
    appState.updateCommitteeMember(committeeId, editingMember.member.facultyId, updates);
    setEditingMember(null);
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Step 3: Assign Faculty to Committees
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select faculty from the left and click a committee to assign them
        </p>
      </div>

      {/* Main assignment interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============ UNASSIGNED FACULTY (LEFT) ============ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Unassigned Faculty ({unassignedFaculty.length})
            </h3>
          </div>

          {unassignedFaculty.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
              All faculty have been assigned or opted out!
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600 max-h-96 overflow-y-auto">
              {unassignedFaculty.map((faculty) => (
                <div
                  key={faculty.id}
                  onClick={() => setSelectedFacultyId(faculty.id)}
                  className={`px-6 py-4 cursor-pointer transition-colors ${
                    selectedFacultyId === faculty.id
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {faculty.firstName} {faculty.lastName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {faculty.college}
                  </div>
                  {faculty.preferences.length > 0 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Prefers: {faculty.preferences.map((p) => p.committeeName).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ COMMITTEES (RIGHT) ============ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Committees
            </h3>
          </div>

          {appState.state.committees.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
              No committees created yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600 max-h-96 overflow-y-auto">
              {appState.state.committees.map((committee) => (
                <div key={committee.id} className="px-6 py-4">
                  <button
                    onClick={() => handleAssignToCommittee(committee.id)}
                    disabled={!selectedFacultyId}
                    className={`w-full px-4 py-2 rounded font-semibold mb-2 transition-colors ${
                      selectedFacultyId
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Assign to {committee.name}
                  </button>

                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Members ({committee.members.length}):
                  </div>

                  {committee.members.length === 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No members yet</div>
                  ) : (
                    <div className="space-y-2">
                      {committee.members.map((member) => {
                        const faculty = appState.getFacultyById(member.facultyId);
                        return (
                          <div
                            key={member.facultyId}
                            className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded"
                          >
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 dark:text-white">
                                {faculty?.firstName} {faculty?.lastName}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {member.role}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingMember({ committeeId: committee.id, member })}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveFromCommittee(committee.id, member.facultyId)
                                }
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <EditMemberModal
          committee={appState.state.committees.find((c) => c.id === editingMember.committeeId)!}
          member={editingMember.member}
          onSave={(updates) => handleUpdateMember(editingMember.committeeId, updates)}
          onClose={() => setEditingMember(null)}
        />
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          Continue to Export →
        </button>
      </div>
    </div>
  );
};

export default AssignmentPage;
