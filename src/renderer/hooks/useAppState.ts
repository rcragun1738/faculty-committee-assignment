/**
 * Global Application State Hook
 *
 * This React hook manages the complete application state using React's useState.
 * It provides a centralized place to manage:
 * - All faculty data
 * - All committee data and assignments
 * - Current academic year
 * - Undo/redo state (optional, currently just latest state)
 *
 * This is a simple state management solution appropriate for this single-user,
 * once-per-year application. For larger apps, Redux or Zustand might be better.
 *
 * Usage in a component:
 *   const { state, updateFaculty, addCommittee, ... } = useAppState();
 */

import { useState, useCallback } from 'react';
import { ProjectState, Faculty, Committee, CommitteeMember } from '../../shared/types';

/**
 * Hook return type - all state and functions to manipulate it
 */
export interface AppStateContextValue {
  state: ProjectState;
  updateState: (newState: ProjectState) => void;

  // Faculty operations
  addFaculty: (faculty: Faculty) => void;
  updateFaculty: (facultyId: string, updatedFaculty: Partial<Faculty>) => void;
  removeFaculty: (facultyId: string) => void;

  // Committee operations
  addCommittee: (committee: Committee) => void;
  updateCommittee: (committeeId: string, updatedCommittee: Partial<Committee>) => void;
  removeCommittee: (committeeId: string) => void;

  // Committee member operations
  addMemberToCommittee: (
    committeeId: string,
    facultyId: string,
    role: CommitteeMember['role'],
    termStart?: number,
    termEnd?: number
  ) => void;
  removeMemberFromCommittee: (committeeId: string, facultyId: string) => void;
  updateCommitteeMember: (
    committeeId: string,
    facultyId: string,
    updates: Partial<CommitteeMember>
  ) => void;

  // Query operations
  getFacultyById: (facultyId: string) => Faculty | undefined;
  getUnassignedFaculty: () => Faculty[];
  getCommitteesByFacultyId: (facultyId: string) => Committee[];
}

/**
 * Creates initial empty project state for a new academic year
 */
function createEmptyState(academicYear: string): ProjectState {
  return {
    academicYear,
    faculty: [],
    committees: [],
    metadata: {
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    },
  };
}

/**
 * Custom hook for managing application state
 *
 * @param initialState - Optional initial state to load (e.g., from previous year)
 * @param academicYear - Academic year for new projects (default: current/next year)
 * @returns State object and functions to update it
 */
export function useAppState(
  initialState?: ProjectState,
  academicYear: string = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
): AppStateContextValue {
  // Initialize state with provided data or empty state
  const [state, setState] = useState<ProjectState>(
    initialState || createEmptyState(academicYear)
  );

  // ==================== Faculty Operations ====================

  /**
   * Add a new faculty member to the state
   */
  const addFaculty = useCallback((faculty: Faculty) => {
    setState((prev) => ({
      ...prev,
      faculty: [...prev.faculty, faculty],
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  /**
   * Update an existing faculty member
   */
  const updateFaculty = useCallback((facultyId: string, updates: Partial<Faculty>) => {
    setState((prev) => ({
      ...prev,
      faculty: prev.faculty.map((f) => (f.id === facultyId ? { ...f, ...updates } : f)),
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  /**
   * Remove a faculty member (and their assignments)
   */
  const removeFaculty = useCallback((facultyId: string) => {
    setState((prev) => ({
      ...prev,
      // Remove faculty from faculty list
      faculty: prev.faculty.filter((f) => f.id !== facultyId),
      // Remove them from all committees
      committees: prev.committees.map((c) => ({
        ...c,
        members: c.members.filter((m) => m.facultyId !== facultyId),
      })),
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  // ==================== Committee Operations ====================

  /**
   * Add a new committee
   */
  const addCommittee = useCallback((committee: Committee) => {
    setState((prev) => ({
      ...prev,
      committees: [...prev.committees, committee],
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  /**
   * Update an existing committee
   */
  const updateCommittee = useCallback((committeeId: string, updates: Partial<Committee>) => {
    setState((prev) => ({
      ...prev,
      committees: prev.committees.map((c) =>
        c.id === committeeId ? { ...c, ...updates } : c
      ),
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  /**
   * Remove a committee (and all its member assignments)
   */
  const removeCommittee = useCallback((committeeId: string) => {
    setState((prev) => ({
      ...prev,
      committees: prev.committees.filter((c) => c.id !== committeeId),
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  // ==================== Committee Member Operations ====================

  /**
   * Add a faculty member to a committee with specified role
   */
  const addMemberToCommittee = useCallback(
    (
      committeeId: string,
      facultyId: string,
      role: CommitteeMember['role'],
      termStart?: number,
      termEnd?: number
    ) => {
      setState((prev) => ({
        ...prev,
        committees: prev.committees.map((c) => {
          if (c.id !== committeeId) return c;

          // Check if faculty is already on this committee
          const alreadyExists = c.members.some((m) => m.facultyId === facultyId);
          if (alreadyExists) {
            return c; // Don't add duplicates
          }

          return {
            ...c,
            members: [
              ...c.members,
              {
                facultyId,
                role,
                termStart,
                termEnd,
              },
            ],
          };
        }),
        metadata: {
          ...prev.metadata,
          lastModified: new Date().toISOString(),
        },
      }));
    },
    []
  );

  /**
   * Remove a faculty member from a committee
   */
  const removeMemberFromCommittee = useCallback((committeeId: string, facultyId: string) => {
    setState((prev) => ({
      ...prev,
      committees: prev.committees.map((c) => {
        if (c.id !== committeeId) return c;
        return {
          ...c,
          members: c.members.filter((m) => m.facultyId !== facultyId),
        };
      }),
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString(),
      },
    }));
  }, []);

  /**
   * Update a committee member's properties (role, term dates, etc.)
   */
  const updateCommitteeMember = useCallback(
    (committeeId: string, facultyId: string, updates: Partial<CommitteeMember>) => {
      setState((prev) => ({
        ...prev,
        committees: prev.committees.map((c) => {
          if (c.id !== committeeId) return c;
          return {
            ...c,
            members: c.members.map((m) =>
              m.facultyId === facultyId ? { ...m, ...updates } : m
            ),
          };
        }),
        metadata: {
          ...prev.metadata,
          lastModified: new Date().toISOString(),
        },
      }));
    },
    []
  );

  // ==================== Query Operations ====================

  /**
   * Find a faculty member by ID
   */
  const getFacultyById = useCallback(
    (facultyId: string) => state.faculty.find((f) => f.id === facultyId),
    [state.faculty]
  );

  /**
   * Get list of faculty who haven't been assigned to any committee
   * Excludes faculty who opted out or are exempt
   */
  const getUnassignedFaculty = useCallback(() => {
    // Get IDs of all faculty on any committee
    const assignedIds = new Set<string>();
    state.committees.forEach((c) => {
      c.members.forEach((m) => {
        assignedIds.add(m.facultyId);
      });
    });

    // Return faculty who want service and aren't assigned yet
    return state.faculty.filter(
      (f) => f.optOutStatus === 'wants' && !assignedIds.has(f.id)
    );
  }, [state.faculty, state.committees]);

  /**
   * Get all committees that a faculty member is assigned to
   */
  const getCommitteesByFacultyId = useCallback(
    (facultyId: string) => {
      return state.committees.filter((c) => c.members.some((m) => m.facultyId === facultyId));
    },
    [state.committees]
  );

  // Return all state and functions
  return {
    state,
    updateState: setState,
    addFaculty,
    updateFaculty,
    removeFaculty,
    addCommittee,
    updateCommittee,
    removeCommittee,
    addMemberToCommittee,
    removeMemberFromCommittee,
    updateCommitteeMember,
    getFacultyById,
    getUnassignedFaculty,
    getCommitteesByFacultyId,
  };
}
