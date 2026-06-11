/**
 * JSON Storage Utility for Faculty Committee Assignment Projects
 *
 * This module handles saving and loading project state to/from JSON files.
 * It enables year-to-year persistence, allowing administrators to:
 * - Save current year's assignments
 * - Load previous year's data as a starting point
 * - Maintain historical records of committee assignments
 *
 * JSON files are stored in the user's Documents folder or a project directory
 * for easy access and backup by the administrator.
 *
 * File format:
 * {
 *   "academicYear": "2026-2027",
 *   "faculty": [ ... ],
 *   "committees": [ ... ],
 *   "metadata": {
 *     "lastModified": "2026-06-15T14:30:00Z",
 *     "createdDate": "2026-04-01T09:00:00Z",
 *     "previousYearPath": "/path/to/2025-2026-assignments.json"
 *   }
 * }
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectState, FileOperationResult } from '../../shared/types';

/**
 * Saves project state to a JSON file.
 * Updates metadata timestamps before saving.
 *
 * @param projectState - The complete project state to save
 * @param filePath - Path where the JSON file should be saved
 * @returns FileOperationResult with success status and file path
 *
 * The function:
 * 1. Updates the lastModified timestamp
 * 2. Creates directory if it doesn't exist
 * 3. Writes JSON with nice formatting (2-space indent) for human readability
 * 4. Returns result with file path on success
 */
export function saveProject(
  projectState: ProjectState,
  filePath: string
): FileOperationResult {
  try {
    // Update the lastModified timestamp to current time (ISO 8601 format)
    // This allows tracking when the project was last edited
    const updatedState: ProjectState = {
      ...projectState,
      metadata: {
        ...projectState.metadata,
        lastModified: new Date().toISOString(),
      },
    };

    // Ensure the directory exists before writing the file
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      // Create directory recursively if it doesn't exist
      // This prevents "ENOENT: no such file or directory" errors
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write the JSON file with 2-space indentation for readability
    // This makes it possible for administrators to edit JSON directly if needed
    // and easy to see what's stored in the file for debugging
    fs.writeFileSync(filePath, JSON.stringify(updatedState, null, 2));

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    // Return error details so UI can show meaningful message to user
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Loads project state from a JSON file.
 * Validates the loaded data before returning.
 *
 * @param filePath - Path to the JSON file to load
 * @returns FileOperationResult with loaded project state or error
 *
 * The function:
 * 1. Reads and parses the JSON file
 * 2. Validates the structure has required fields
 * 3. Returns project state if valid
 * 4. Returns error details if invalid or file doesn't exist
 */
export function loadProject(filePath: string): FileOperationResult {
  try {
    // Check if file exists before trying to read
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`,
      };
    }

    // Read the file as a string
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse the JSON content into a JavaScript object
    const parsedData = JSON.parse(fileContent) as ProjectState;

    // Validate that the loaded data has the expected structure
    const validation = validateProjectState(parsedData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Return the successfully loaded project state
    return {
      success: true,
      filePath,
      data: parsedData,
    };
  } catch (error) {
    // Catch both file system errors (read failed) and JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: `Invalid JSON format: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validates that a loaded ProjectState has the expected structure.
 * Ensures all required fields are present and have correct types.
 *
 * This validation prevents corrupted or manually-edited JSON files from
 * breaking the application.
 *
 * @param projectState - The data to validate
 * @returns Validation result with isValid flag and error message if invalid
 */
function validateProjectState(projectState: unknown): {
  isValid: boolean;
  error?: string;
} {
  // First, check that we have an object
  if (typeof projectState !== 'object' || projectState === null) {
    return {
      isValid: false,
      error: 'Project state must be an object',
    };
  }

  const state = projectState as Record<string, unknown>;

  // Validate required top-level fields
  if (typeof state.academicYear !== 'string') {
    return {
      isValid: false,
      error: 'Missing or invalid academicYear field (must be string)',
    };
  }

  if (!Array.isArray(state.faculty)) {
    return {
      isValid: false,
      error: 'Missing or invalid faculty field (must be array)',
    };
  }

  if (!Array.isArray(state.committees)) {
    return {
      isValid: false,
      error: 'Missing or invalid committees field (must be array)',
    };
  }

  if (typeof state.metadata !== 'object' || state.metadata === null) {
    return {
      isValid: false,
      error: 'Missing or invalid metadata field (must be object)',
    };
  }

  const metadata = state.metadata as Record<string, unknown>;
  if (typeof metadata.lastModified !== 'string') {
    return {
      isValid: false,
      error: 'Missing or invalid metadata.lastModified field (must be string)',
    };
  }

  if (typeof metadata.createdDate !== 'string') {
    return {
      isValid: false,
      error: 'Missing or invalid metadata.createdDate field (must be string)',
    };
  }

  // All validations passed
  return {
    isValid: true,
  };
}

/**
 * Gets list of recently saved project files from the default save directory.
 * Useful for showing recent projects in the UI.
 *
 * @param defaultDir - Directory to search for project files
 * @param limit - Maximum number of recent files to return (default: 5)
 * @returns Array of file paths sorted by modification time (newest first)
 */
export function getRecentProjects(
  defaultDir: string,
  limit: number = 5
): { filePath: string; fileName: string; lastModified: Date }[] {
  try {
    // Check if directory exists
    if (!fs.existsSync(defaultDir)) {
      return [];
    }

    // Read all files in the directory
    const files = fs.readdirSync(defaultDir);

    // Filter for JSON files and get their stats
    const jsonFiles = files
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = path.join(defaultDir, file);
        const stats = fs.statSync(filePath);
        return {
          filePath,
          fileName: file,
          lastModified: stats.mtime,
        };
      });

    // Sort by modification time (newest first)
    jsonFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    // Return only the requested number of recent files
    return jsonFiles.slice(0, limit);
  } catch (error) {
    // If directory read fails, return empty list
    console.error('Error reading recent projects:', error);
    return [];
  }
}

/**
 * Creates a backup of a project file before making modifications.
 * Appends timestamp to backup filename.
 *
 * Example: "2026-assignments.json" becomes "2026-assignments.backup.2026-06-15.json"
 *
 * @param filePath - Original file path
 * @returns FileOperationResult with backup path or error
 */
export function createBackup(filePath: string): FileOperationResult {
  try {
    // Check if original file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `Original file not found: ${filePath}`,
      };
    }

    // Generate backup filename with timestamp
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const backupPath = path.join(dir, `${name}.backup.${timestamp}${ext}`);

    // Copy file to backup location
    // This preserves the original file contents at a known time
    fs.copyFileSync(filePath, backupPath);

    return {
      success: true,
      filePath: backupPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
