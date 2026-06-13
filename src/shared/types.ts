/**
 * Shared TypeScript interfaces used throughout the Faculty Committee Assignment application.
 * These types are shared between the Electron main process and the React renderer.
 * This ensures consistency in data structures across the entire application.
 */

/**
 * Represents a faculty member.
 *
 * Faculty members are imported from the Qualtrics survey CSV or added manually.
 * Each faculty member has preferences for up to 3 committees and can opt out or be exempt.
 */
export interface Faculty {
  // Unique identifier for this faculty member (typically firstname-lastname or UUID)
  id: string;

  // Basic identifying information
  firstName: string;
  lastName: string;

  // College/department information (used for filtering and organizational purposes)
  college: string;

  // Committee service status for this academic year
  // 'wants' = willing to serve on a university committee
  // 'opted-out' = does not want a committee assignment
  // 'exempt' = exempt from committee service (e.g., director, sabbatical, etc.)
  optOutStatus: 'wants' | 'opted-out' | 'exempt';

  // Explanation for opt-out or exempt status (e.g., "On sabbatical", "Director of...")
  optOutReason: string;

  // Up to 3 committee preferences ranked by priority (from Qualtrics survey)
  preferences: CommitteePreference[];

  // Additional comments from the faculty member explaining their choices or constraints
  // (Very valuable information for decision-making during assignment process)
  comments: string;

  // When true, this faculty member may be assigned to more than one committee.
  // By default faculty leave the assignment pool once assigned to a single
  // committee; flagging them keeps them available so they can serve on several.
  allowMultiple?: boolean;
}

/**
 * Represents a single committee preference for a faculty member.
 * Faculty can list up to 3 preferences, each with a rank (1st, 2nd, 3rd choice).
 */
export interface CommitteePreference {
  // Rank of this preference: 1 = first choice, 2 = second choice, 3 = third choice
  rank: 1 | 2 | 3;

  // Name of the preferred committee
  committeeName: string;
}

/**
 * Represents a university committee.
 * Committees can be elected or appointed, with specific term lengths and member roles.
 */
export interface Committee {
  // Unique identifier for this committee
  id: string;

  // Human-readable name of the committee (e.g., "Academic Integrity Committee")
  name: string;

  // Type of committee:
  // 'elected' = members serve for specified term lengths (e.g., 2 years)
  // 'appointed' = members serve indefinitely or until manually removed
  type: 'elected' | 'appointed';

  // Optional description or notes about the committee
  description: string;

  // List of faculty members currently assigned to this committee
  members: CommitteeMember[];
}

/**
 * Represents a faculty member's assignment to a specific committee.
 * Tracks their role, term dates (for elected committees), and other metadata.
 */
export interface CommitteeMember {
  // ID of the faculty member assigned to this committee
  facultyId: string;

  // Role this faculty member has on the committee. Common values are 'member',
  // 'chair', 'secretary', and 'ex-officio', but the list of available roles is
  // configurable in Settings, so this is stored as a free-form string.
  role: string;

  // Term start year (academic year format, e.g., 2026 for 2026-2027 academic year)
  // Optional because appointed committees may not have defined terms
  termStart?: number;

  // Term end year (academic year format, e.g., 2028 for 2028-2029 academic year)
  // For elected committees, this indicates when the term expires and the position comes up for re-election
  termEnd?: number;
}

/**
 * User-configurable settings for a project (edited via the Settings dialog).
 * Saved inside the project file so each year's project carries its own setup.
 */
export interface ProjectSettings {
  // Term start/end years offered in the assignment "Edit" dropdowns.
  // Stored as the starting year of each academic year (e.g. 2025 = 2025-2026).
  serviceYears: number[];

  // Roles that can be assigned to a committee member. Stored lowercase; the UI
  // and exports display them capitalized (e.g. 'ex-officio' -> 'Ex-Officio').
  roles: string[];
}

/**
 * Default roles available when a project has no custom roles configured.
 */
export const DEFAULT_ROLES: string[] = ['member', 'chair', 'secretary', 'ex-officio'];

/**
 * Builds the default list of service years: 2023 through five years past the
 * current year, so prior years are available for mid-stream setups.
 */
export function defaultServiceYears(): number[] {
  const start = 2023;
  const end = new Date().getFullYear() + 5;
  const years: number[] = [];
  for (let year = start; year <= end; year++) {
    years.push(year);
  }
  return years;
}

/**
 * Builds the default settings object for a new or upgraded project.
 */
export function defaultSettings(): ProjectSettings {
  return {
    serviceYears: defaultServiceYears(),
    roles: [...DEFAULT_ROLES],
  };
}

/**
 * Represents the complete state of a committee assignment project.
 * This is the top-level structure that gets saved to and loaded from JSON files.
 */
export interface ProjectState {
  // Academic year this project is for (e.g., "2026-2027")
  // Used for organizational purposes and record-keeping
  academicYear: string;

  // List of all faculty members (including those opted out or exempt)
  faculty: Faculty[];

  // List of all committees and their member assignments
  committees: Committee[];

  // User-configurable settings (service years, roles). Optional for backward
  // compatibility with project files saved before settings existed; the app
  // fills in defaults when loading such files.
  settings?: ProjectSettings;

  // Metadata about the project for tracking and historical purposes
  metadata: ProjectMetadata;
}

/**
 * Metadata about a committee assignment project.
 * Tracks creation/modification dates and references to previous years' projects.
 */
export interface ProjectMetadata {
  // ISO 8601 timestamp of last modification (e.g., "2026-04-15T14:30:00Z")
  // Used to track when the project was last edited
  lastModified: string;

  // ISO 8601 timestamp of project creation
  createdDate: string;

  // Optional file path to the previous year's project
  // Useful for loading historical data and comparing year-to-year changes
  previousYearPath?: string;

  // Optional notes or version information for future extensibility
  notes?: string;
}

/**
 * How committee sheets should be ordered in the exported Excel workbook.
 * - 'as-listed'    = committee creation order (default)
 * - 'alphabetical' = committee name A–Z
 * - 'by-type'      = grouped by type (elected first, then appointed), A–Z within each group
 */
export type SheetOrder = 'as-listed' | 'alphabetical' | 'by-type';

/**
 * Response object from CSV import operation.
 * Returned by IPC handler to report import results and any issues encountered.
 */
export interface ImportResult {
  // List of successfully imported faculty
  faculty: Faculty[];

  // List of committees found in the survey data
  committees: string[];

  // Array of any warnings or issues encountered during import
  // (e.g., "Faculty John Doe has no email address")
  warnings: string[];

  // Number of faculty successfully imported
  importedCount: number;
}

/**
 * Response object from Excel export operation.
 * Returned by IPC handler to report export success or failure.
 */
export interface ExportResult {
  // True if export was successful, false if there was an error
  success: boolean;

  // Path to the generated Excel file (if successful)
  filePath?: string;

  // Error message (if unsuccessful)
  error?: string;

  // Number of sheets generated in the Excel workbook
  sheetsCreated?: number;
}

/**
 * Response object for save/load operations.
 * Communicates success or failure of JSON file operations.
 */
export interface FileOperationResult {
  // True if operation was successful
  success: boolean;

  // Path to the file that was saved/loaded
  filePath?: string;

  // Error message (if unsuccessful)
  error?: string;

  // The loaded ProjectState (only for load operations)
  data?: ProjectState;
}
