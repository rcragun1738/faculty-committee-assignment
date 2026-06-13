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

import React, { useState, useRef, useEffect } from 'react';
import { Committee, CommitteeMember, defaultSettings } from '../../shared/types';
import { AppStateContextValue } from '../hooks/useAppState';

/** Capitalize a role for display, e.g. 'ex-officio' -> 'Ex-Officio'. */
function displayRole(role: string): string {
  return role
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

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
  roles: string[];
  serviceYears: number[];
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
  roles,
  serviceYears,
  onSave,
  onClose,
}) => {
  const [role, setRole] = useState<CommitteeMember['role']>(member.role);
  const [termStart, setTermStart] = useState(member.termStart || serviceYears[0] || 2026);
  const [termEnd, setTermEnd] = useState(
    member.termEnd || serviceYears[1] || (serviceYears[0] || 2026) + 1
  );

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
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {/* Show the member's current role even if it's no longer in the
                  configured list, so it isn't silently changed. */}
              {!roles.includes(role) && <option value={role}>{displayRole(role)}</option>}
              {roles.map((r) => (
                <option key={r} value={r}>
                  {displayRole(r)}
                </option>
              ))}
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
                  {serviceYears.map((year) => (
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
                  {serviceYears.map((year) => (
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
  // Free-text search over the faculty list
  const [facultySearch, setFacultySearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  // IDs of committees whose member lists are collapsed (accordion)
  const [collapsedCommittees, setCollapsedCommittees] = useState<Set<string>>(new Set());
  // Filter the faculty list by service status. Defaults to 'wants' (only faculty
  // who want service), but can be switched to 'all' to show everyone — including
  // exempt and opted-out faculty — so they can still be assigned (e.g. to elected
  // committees).
  const [statusFilter, setStatusFilter] = useState<'wants' | 'exempt' | 'opted-out' | 'all'>('wants');
  const [committeeSort, setCommitteeSort] = useState<'name' | 'size'>('name');

  // Ctrl+F (Cmd+F on Mac) focuses the faculty search box, like other programs.
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

  // Toggle a single committee's collapsed state
  const toggleCommitteeCollapsed = (committeeId: string) => {
    setCollapsedCommittees((prev) => {
      const next = new Set(prev);
      if (next.has(committeeId)) {
        next.delete(committeeId);
      } else {
        next.add(committeeId);
      }
      return next;
    });
  };

  const collapseAllCommittees = () => {
    setCollapsedCommittees(new Set(appState.state.committees.map((c) => c.id)));
  };

  const expandAllCommittees = () => {
    setCollapsedCommittees(new Set());
  };

  // Project settings (roles, service years), with defaults as a fallback
  const settings = appState.state.settings || defaultSettings();
  // Role given to a faculty member when first assigned to a committee
  const defaultRole = settings.roles[0] || 'member';

  // Get unassigned faculty (all statuses)
  let unassignedFaculty = appState.getUnassignedFaculty();

  // Filter by service status unless "all" is selected
  if (statusFilter !== 'all') {
    unassignedFaculty = unassignedFaculty.filter((f) => f.optOutStatus === statusFilter);
  }

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

  // Filter by the free-text search (name, college, or committee preference)
  const searchQuery = facultySearch.trim().toLowerCase();
  if (searchQuery) {
    unassignedFaculty = unassignedFaculty.filter((faculty) => {
      const haystack = [
        faculty.firstName,
        faculty.lastName,
        `${faculty.firstName} ${faculty.lastName}`,
        faculty.college,
        ...faculty.preferences.map((p) => p.committeeName),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchQuery);
    });
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
    appState.addMemberToCommittee(committeeId, selectedFacultyId, defaultRole);
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
          Use the <span className="font-semibold">📌 Multi</span> button to let someone serve on
          more than one committee.
        </p>
      </div>

      {/* Main assignment interface - both columns with independent scroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============ UNASSIGNED FACULTY (LEFT) ============ */}
        <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden`}>
          <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Faculty to Assign ({unassignedFaculty.length})
            </h3>
            <div className="space-y-2">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={facultySearch}
                  onChange={(e) => setFacultySearch(e.target.value)}
                  placeholder="Search faculty (Ctrl+F)"
                  className="w-full px-2 py-1 pr-7 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
                />
                {facultySearch && (
                  <button
                    onClick={() => setFacultySearch('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
              >
                <option value="wants">Status: Available (wants service)</option>
                <option value="all">Status: All faculty (incl. exempt / opted-out)</option>
                <option value="exempt">Status: Exempt only</option>
                <option value="opted-out">Status: Opted out only</option>
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
            <div className="h-[500px] min-h-[200px] resize-y overflow-y-auto">
              {unassignedFaculty.map((faculty) => {
                // How many committees this person is already on, used for the
                // count badge and the purple "multi-committee" highlight.
                const assignedCount = appState.getCommitteesByFacultyId(faculty.id).length;
                const isMulti = assignedCount >= 2;
                const isSelected = selectedFacultyId === faculty.id;
                return (
                  <div
                    key={faculty.id}
                    className={`px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-start gap-2 transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : isMulti
                          ? 'bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/60'
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
                      {assignedCount > 0 && (
                        <div
                          className={`inline-block text-xs font-semibold mt-1 px-2 py-0.5 rounded ${
                            isMulti
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-100'
                          }`}
                        >
                          On {assignedCount} committee{assignedCount !== 1 ? 's' : ''}
                        </div>
                      )}
                      {faculty.optOutStatus !== 'wants' && (
                        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                          {faculty.optOutStatus === 'exempt' ? 'Exempt' : 'Opted out'}
                          {faculty.optOutReason ? ` — ${faculty.optOutReason}` : ''}
                        </div>
                      )}
                      {faculty.preferences.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Prefers: {faculty.preferences.map((p) => p.committeeName).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-1 items-stretch">
                      {/* Toggle whether this person may serve on multiple committees.
                          When on, they stay in this list after being assigned. */}
                      <button
                        onClick={() =>
                          appState.updateFaculty(faculty.id, {
                            allowMultiple: !faculty.allowMultiple,
                          })
                        }
                        title={
                          faculty.allowMultiple
                            ? 'Allowed on multiple committees — click to restrict to one'
                            : 'Allow this person on multiple committees'
                        }
                        className={`px-2 py-1 rounded text-xs font-semibold border ${
                          faculty.allowMultiple
                            ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        📌 Multi
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${faculty.firstName} ${faculty.lastName} from this list?`
                            )
                          ) {
                            appState.removeFaculty(faculty.id);
                          }
                        }}
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
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={collapseAllCommittees}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Collapse all
                  </button>
                  <button
                    onClick={expandAllCommittees}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Expand all
                  </button>
                </div>
              </div>
              <div className="h-[500px] min-h-[200px] resize-y overflow-y-auto p-3 space-y-3">
                {sortedCommittees.map((committee) => {
                  const isCollapsed = collapsedCommittees.has(committee.id);
                  return (
                  <div
                    key={committee.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4"
                  >
                    {/* Committee Header (click to collapse/expand members) */}
                    <button
                      onClick={() => toggleCommitteeCollapsed(committee.id)}
                      className="w-full flex items-center justify-between mb-3 text-left"
                      title={isCollapsed ? 'Show members' : 'Hide members'}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {isCollapsed ? '▶' : '▼'}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-white truncate">
                          {committee.name}
                        </span>
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex-shrink-0 ml-2">
                        {committee.members.length} member{committee.members.length !== 1 ? 's' : ''}
                      </span>
                    </button>

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

                    {/* Members List (hidden when this committee is collapsed) */}
                    {!isCollapsed &&
                      (committee.members.length === 0 ? (
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
                                  {displayRole(member.role)}
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
                      ))}
                  </div>
                  );
                })}
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
                  appState.addMemberToCommittee(c.id, contextMenu.facultyId, defaultRole);
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
          roles={settings.roles}
          serviceYears={settings.serviceYears}
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
