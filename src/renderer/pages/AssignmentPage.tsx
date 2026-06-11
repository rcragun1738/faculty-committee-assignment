/**
 * Faculty to Committee Assignment Page
 *
 * This page allows users to assign faculty members to committees.
 * Features:
 * 1. Click faculty → click committee (primary method)
 * 2. Right-click context menu for quick assignment
 * 3. Edit member roles and term dates
 * 4. Remove faculty from committees
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
 *
 * Allows click-based assignment of faculty to committees with right-click context menu
 */
const AssignmentPage: React.FC<AssignmentPageProps> = ({ appState, onComplete }) => {
  // Track selected faculty for click-based assignment
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  // Track which member is being edited
  const [editingMember, setEditingMember] = useState<{
    committeeId: string;
    member: CommitteeMember;
  } | null>(null);
  // Track right-click menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    facultyId: string;
  } | null>(null);
  // Track sorting and filtering options
  const [facultySort, setFacultySort] = useState<'last-name' | 'first-name' | 'college'>('last-name');
  const [preferenceFilter, setPreferenceFilter] = useState<string>('all'); // Committee ID or 'all'
  const [committeeSort, setCommitteeSort] = useState<'name' | 'size'>('name');

  // Get unassigned faculty
  let unassignedFaculty = appState.getUnassignedFaculty();

  // Filter by committee preference if selected
  if (preferenceFilter !== 'all') {
    unassignedFaculty = unassignedFaculty.filter((faculty) =>
      faculty.preferences.some((pref) => {
        // Find the committee by name to match with the filter
        return appState.state.committees.some(
          (c) => c.id === preferenceFilter && c.name === pref.committeeName
        );
      })
    );
  }

  // Sort faculty based on selected sort option
  unassignedFaculty = [...unassignedFaculty].sort((a, b) => {
    switch (facultySort) {
      case 'last-name':
        return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
      case 'first-name':
        return a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName);
      case 'college':
        return a.college.localeCompare(b.college) || a.lastName.localeCompare(b.lastName);
      default:
        return 0;
    }
  });

  // Sort committees based on selected sort option
  let sortedCommittees = [...appState.state.committees].sort((a, b) => {
    switch (committeeSort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return a.members.length - b.members.length || a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  /**
   * Handle assigning faculty to committee via click
   */
  const handleAssignToCommittee = (committeeId: string) => {
    if (!selectedFacultyId) return;
    appState.addMemberToCommittee(committeeId, selectedFacultyId, 'member');
    setSelectedFacultyId(null);
  };

  /**
   * Handle right-click context menu
   */
  const handleContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    facultyId: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      facultyId,
    });
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
          Click faculty name, then click "Assign Selected" button. Right-click for quick menu.
        </p>
      </div>

      {/* Main assignment interface - both columns with independent scroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============ UNASSIGNED FACULTY (LEFT) ============ */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden`}>
          <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Unassigned Faculty ({unassignedFaculty.length})
            </h3>
            <div className="space-y-2">
              <select
                value={facultySort}
                onChange={(e) => setFacultySort(e.target.value as typeof facultySort)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
              >
                <option value="last-name">Sort: Last Name</option>
                <option value="first-name">Sort: First Name</option>
                <option value="college">Sort: College</option>
              </select>
              <select
                value={preferenceFilter}
                onChange={(e) => setPreferenceFilter(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
              >
                <option value="all">Filter: All Committees</option>
                {appState.state.committees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    Filter: Prefers {committee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {unassignedFaculty.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
              All faculty have been assigned or opted out!
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {unassignedFaculty.map((faculty) => (
                <div
                  key={faculty.id}
                  className={`px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-start gap-2 transition-colors ${
                    selectedFacultyId === faculty.id
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div
                    onClick={() => setSelectedFacultyId(faculty.id)}
                    onContextMenu={(e) => handleContextMenu(e, faculty.id)}
                    className="cursor-pointer flex-1"
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
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${faculty.firstName} ${faculty.lastName} from this list?`)) {
                        appState.removeFaculty(faculty.id);
                      }
                    }}
                    className="flex-shrink-0 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ COMMITTEES (RIGHT) ============ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
          {appState.state.committees.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              No committees created yet.
            </div>
          ) : (
            <>
              <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  Committees ({appState.state.committees.length})
                </h3>
                <select
                  value={committeeSort}
                  onChange={(e) => setCommitteeSort(e.target.value as typeof committeeSort)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
                >
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="size">Sort: Size (smallest first)</option>
                </select>
              </div>
              <div className="max-h-[500px] overflow-y-auto p-3 space-y-3">
                {sortedCommittees.map((committee) => (
                  <div
                    key={committee.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4"
                  >
                    {/* Committee Header */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        {committee.name}
                      </h4>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {committee.members.length} member{committee.members.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Assign Button */}
                    <button
                      onClick={() => handleAssignToCommittee(committee.id)}
                      disabled={!selectedFacultyId}
                      className={`w-full px-3 py-2 rounded text-sm font-semibold mb-3 transition-colors ${
                        selectedFacultyId
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Assign Selected
                    </button>

                    {/* Members List */}
                    {committee.members.length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">
                        No members
                      </div>
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
                                  onClick={() =>
                                    setEditingMember({ committeeId: committee.id, member })
                                  }
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
            </>
          )}
        </div>
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-40"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={() => setContextMenu(null)}
        >
          <div className="p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">
              Add to committee:
            </p>
            {appState.state.committees.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  appState.addMemberToCommittee(c.id, contextMenu.facultyId, 'member');
                  setContextMenu(null);
                }}
                className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
              >
                {c.name}
              </button>
            ))}
            {appState.state.committees.length > 5 && (
              <button className="block w-full text-left px-3 py-1 text-sm text-gray-500 dark:text-gray-400">
                +{appState.state.committees.length - 5} more...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMember && (
        <EditMemberModal
          committee={appState.state.committees.find((c) => c.id === editingMember.committeeId)!}
          member={editingMember.member}
          onSave={(updates) =>
            handleUpdateMember(editingMember.committeeId, updates)
          }
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
