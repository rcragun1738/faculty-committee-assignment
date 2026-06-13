/**
 * CSV Parser for Qualtrics Faculty Committee Preference Survey
 *
 * This module handles parsing the CSV export from the Qualtrics survey.
 * The survey structure includes:
 * - Faculty basic info (name, college)
 * - Committee opt-out/exempt status
 * - Up to 3 ranked committee preferences
 * - Optional comments explaining choices
 *
 * Qualtrics exports data with columns like:
 * - firstname, lastname, college (basic info)
 * - optout, exempt, exemptReason (status)
 * - committeepref_0_53_RANK, committeepref_1_54_RANK, etc. (preferences)
 *
 * The numeric codes (53, 54, 55, etc.) correspond to specific committees.
 * This parser maps those codes to human-readable committee names.
 */

import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { Faculty, CommitteePreference, ImportResult } from '../../shared/types';

/**
 * Maps Qualtrics committee code numbers to human-readable committee names.
 * These codes are determined by the survey structure in Qualtrics.
 * Update this mapping if new committees are added to the survey.
 */
const COMMITTEE_CODE_MAP: Record<string, string> = {
  '53': 'Academic Appeals Committee',
  '54': 'Academic Integrity Committee',
  '55': 'Accommodations and Accessibility Committee',
  '56': 'Advising Committee',
  '57': 'Benefits and Salary Committee',
  '58': 'Community Engagement and Responsible Citizenship Committee',
  '59': 'Faculty Access Committee',
  '60': 'Faculty Handbook Committee',
  '61': 'Faculty Workload Committee',
  '62': 'First Year Committee',
  '63': 'Graduate Academic Standards Committee',
  '64': 'Graduate Admissions Policies Committee',
  '65': "Honor's Committee",
  '66': 'Instructional Technology Committee',
  '67': 'International Programs Committee',
  '68': 'Internship Committee',
  '69': 'Library Committee',
  '70': 'Online Teaching and Learning Committee',
  '71': 'Sustainability Committee',
  '72': 'Undergraduate Academic Standards Committee',
  '73': 'Undergraduate Admissions Policies Committee',
  '74': 'Undergraduate Research and Inquiry Committee',
};

/**
 * Parses CSV data from Qualtrics survey export.
 *
 * @param csvContent - Raw CSV file content as a string
 * @returns ImportResult containing parsed faculty, committees, warnings, and counts
 *
 * The function:
 * 1. Parses the CSV using csv-parse library
 * 2. Extracts header row to understand column structure
 * 3. For each data row, extracts faculty info and preferences
 * 4. Maps committee codes to names
 * 5. Returns structured Faculty objects ready for use in the application
 */
export function parseQualtricsCsv(csvContent: string): ImportResult {
  const warnings: string[] = [];
  const faculty: Faculty[] = [];
  const committeeSet = new Set<string>();

  try {
    // Parse CSV content into a 2D array
    // The csv-parse library handles quoted fields, escaped characters, etc.
    const records = parse(csvContent, {
      columns: true, // Use first row as header names
      skip_empty_lines: true,
      relax_quotes: true, // More lenient with quote handling
    }) as Record<string, string>[];

    // Process each faculty response from the survey
    for (const record of records) {
      // Extract basic faculty information
      // Trim whitespace as Qualtrics sometimes includes extra spaces
      const firstName = (record.firstname || '').trim();
      const lastName = (record.lastname || '').trim();
      const college = (record.college || '').trim();

      // Skip Qualtrics metadata rows (human-readable descriptions and ImportId metadata)
      // These appear at the beginning of the export before actual response data
      // They have labels like "Please enter your first name" or JSON like {"ImportId":"..."} instead of actual names
      if (
        firstName.includes('Please') ||
        firstName.includes('ImportId') ||
        firstName.includes('{') ||
        lastName.includes('Please') ||
        lastName.includes('ImportId') ||
        lastName.includes('{')
      ) {
        // This is a metadata row, skip it
        continue;
      }

      // Skip empty records (sometimes Qualtrics includes blank rows)
      if (!firstName && !lastName) {
        continue;
      }

      // Generate a unique ID using UUID
      // We use UUID instead of firstname-lastname to handle duplicate names
      // (e.g., two "Sara Bryson"s would otherwise have the same ID)
      const id = uuidv4();

      // Extract opt-out/exempt status
      const optOutField = record.optout || '';
      let optOutStatus: 'wants' | 'opted-out' | 'exempt' = 'wants';
      let optOutReason = '';

      if (optOutField.includes('do NOT want')) {
        optOutStatus = 'opted-out';
        optOutReason = record.exempt || '';
      } else if (optOutField.includes('exempt')) {
        optOutStatus = 'exempt';
        optOutReason = record.exempt || '';
      }

      // Extract preferences (up to 3 committee choices)
      // Qualtrics stores preferences with patterns like:
      // committeepref_0_GROUP (first choice group/name)
      // committeepref_0_53_RANK (ranking if selected, value = 1 if selected)
      const preferences: CommitteePreference[] = [];

      // Check each choice slot (0, 1, 2 for first, second, third)
      for (let choiceIndex = 0; choiceIndex < 3; choiceIndex++) {
        // Look for committee codes in this choice slot
        // Codes range from 53-74 based on COMMITTEE_CODE_MAP
        for (const [code, committeeName] of Object.entries(COMMITTEE_CODE_MAP)) {
          // Build the expected column name for this committee code and choice
          // Example: committeepref_0_53_RANK for first choice, Academic Appeals Committee
          const rankColumnName = `committeepref_${choiceIndex}_${code}_RANK`;

          // If this column exists and has a value, this is a selected preference
          if (record[rankColumnName]) {
            preferences.push({
              rank: (choiceIndex + 1) as 1 | 2 | 3,
              committeeName: committeeName,
            });

            // Add to set of all committees for return value
            committeeSet.add(committeeName);
          }
        }
      }

      // Extract optional comments explaining choices
      // Qualtrics stores this in the 'comments' column
      const comments = (record.comments || '').trim();

      // Create Faculty object from parsed data
      const facultyMember: Faculty = {
        id,
        firstName,
        lastName,
        college,
        optOutStatus,
        optOutReason,
        preferences,
        comments,
      };

      // Add warnings for missing college information
      if (!college) {
        warnings.push(`${firstName} ${lastName}: No college information provided`);
      }

      faculty.push(facultyMember);
    }

    // Return structured result
    return {
      faculty,
      committees: Array.from(committeeSet).sort(),
      warnings,
      importedCount: faculty.length,
    };
  } catch (error) {
    // If parsing fails, throw error with helpful context
    throw new Error(
      `Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validates that parsed CSV data has expected structure.
 * Useful for detecting corrupted or incorrectly formatted CSV files.
 *
 * @param csvContent - Raw CSV content
 * @returns Object with validation results
 */
export function validateCsvStructure(csvContent: string): {
  isValid: boolean;
  missingColumns: string[];
  message: string;
} {
  const requiredColumns = ['firstname', 'lastname', 'college', 'optout'];

  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      return {
        isValid: false,
        missingColumns: [],
        message: 'CSV file is empty or contains only headers',
      };
    }

    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRecord));

    if (missingColumns.length > 0) {
      return {
        isValid: false,
        missingColumns,
        message: `CSV is missing required columns: ${missingColumns.join(', ')}`,
      };
    }

    return {
      isValid: true,
      missingColumns: [],
      message: 'CSV structure is valid',
    };
  } catch (error) {
    return {
      isValid: false,
      missingColumns: [],
      message: `CSV validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
