/**
 * Excel Exporter for Faculty Committee Assignments
 *
 * This module generates professional Excel files from the committee assignment data.
 * The Excel file structure includes:
 * - One sheet per committee with detailed member information
 * - Summary sheet with overview of all committees
 * - Faculty sheet listing all faculty and their assignments
 * - Professional formatting: colors, bold headers, proper column widths
 *
 * Uses the exceljs library for reliable Excel generation across all platforms.
 */

import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { Faculty, Committee, CommitteeMember, ProjectState } from '../../shared/types';

/**
 * Generates an Excel workbook from committee assignment data.
 *
 * @param projectState - Complete project state containing all assignments
 * @param outputPath - File path where the Excel file should be saved
 * @returns Promise that resolves when file is written
 *
 * Creates the following sheets:
 * 1. "Summary" - Overview of all committees, member counts, leadership
 * 2. One sheet per committee with member details
 * 3. "Faculty" - List of all faculty and their assignments
 *
 * Formatting applied:
 * - Header rows with light blue background and white text
 * - Alternating row colors for readability
 * - Frozen header rows for easy scrolling
 * - Appropriate column widths
 * - Borders around all cells
 */
export async function exportToExcel(
  projectState: ProjectState,
  outputPath: string
): Promise<void> {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();

  // Create mapping of faculty ID to Faculty object for quick lookup
  const facultyMap = new Map<string, Faculty>();
  projectState.faculty.forEach((f) => facultyMap.set(f.id, f));

  // Step 1: Create Summary sheet with overview
  createSummarySheet(workbook, projectState, facultyMap);

  // Step 2: Create individual committee sheets
  projectState.committees.forEach((committee) => {
    createCommitteeSheet(workbook, committee, projectState, facultyMap);
  });

  // Step 3: Create Faculty sheet listing all faculty
  createFacultySheet(workbook, projectState);

  // Write the workbook to the specified file path
  await workbook.xlsx.writeFile(outputPath);
}

/**
 * Creates the Summary sheet showing overview of all committees.
 * Includes: committee name, type, member count, chair name, etc.
 */
function createSummarySheet(
  workbook: ExcelJS.Workbook,
  projectState: ProjectState,
  facultyMap: Map<string, Faculty>
): void {
  const sheet = workbook.addWorksheet('Summary');

  // Define header row
  const headers = ['Committee', 'Type', 'Members', 'Chair', 'Secretary'];
  const headerRow = sheet.addRow(headers);

  // Format header row: blue background, white text, bold
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0284C7' }, // Professional blue color
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Freeze the header row so it stays visible while scrolling
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Set column widths for readability
  sheet.columns = [
    { width: 40 }, // Committee name
    { width: 12 }, // Type
    { width: 10 }, // Member count
    { width: 20 }, // Chair name
    { width: 20 }, // Secretary name
  ];

  // Add data rows for each committee
  projectState.committees.forEach((committee, index) => {
    // Find the chair and secretary for this committee
    const chair = committee.members.find((m) => m.role === 'chair');
    const secretary = committee.members.find((m) => m.role === 'secretary');

    // Get human-readable names from faculty data
    const chairName = chair ? facultyMap.get(chair.facultyId)?.firstName : '';
    const secretaryName = secretary ? facultyMap.get(secretary.facultyId)?.firstName : '';

    const row = sheet.addRow([
      committee.name,
      committee.type.charAt(0).toUpperCase() + committee.type.slice(1), // Capitalize
      committee.members.length, // Count of members
      chairName || '-',
      secretaryName || '-',
    ]);

    // Alternate row colors for readability (light gray for every other row)
    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }, // Light gray
      };
    }

    // Center align the Type and Members columns
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };

    // Add borders to all cells
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Add borders to header row
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
}

/**
 * Creates an individual sheet for each committee.
 * Shows all members, their roles, terms (if elected), and college affiliation.
 */
function createCommitteeSheet(
  workbook: ExcelJS.Workbook,
  committee: Committee,
  projectState: ProjectState,
  facultyMap: Map<string, Faculty>
): void {
  // Limit sheet name to 31 characters (Excel limit) to avoid errors
  const sheetName = committee.name.substring(0, 31);
  const sheet = workbook.addWorksheet(sheetName);

  // Define header columns
  const headers =
    committee.type === 'elected'
      ? ['Name', 'College', 'Role', 'Term Start', 'Term End']
      : ['Name', 'College', 'Role']; // No term columns for appointed

  const headerRow = sheet.addRow(headers);

  // Format header row
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0284C7' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Freeze header
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Set column widths
  if (committee.type === 'elected') {
    sheet.columns = [
      { width: 25 }, // Name
      { width: 30 }, // College
      { width: 15 }, // Role
      { width: 12 }, // Term Start
      { width: 12 }, // Term End
    ];
  } else {
    sheet.columns = [
      { width: 25 }, // Name
      { width: 30 }, // College
      { width: 15 }, // Role
    ];
  }

  // Add data rows for each committee member
  committee.members.forEach((member, index) => {
    const faculty = facultyMap.get(member.facultyId);
    if (!faculty) return; // Skip if faculty not found

    const rowData =
      committee.type === 'elected'
        ? [
            `${faculty.firstName} ${faculty.lastName}`,
            faculty.college,
            capitalizeRole(member.role),
            member.termStart || '-',
            member.termEnd || '-',
          ]
        : [
            `${faculty.firstName} ${faculty.lastName}`,
            faculty.college,
            capitalizeRole(member.role),
          ];

    const row = sheet.addRow(rowData);

    // Alternate row colors
    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }

    // Add borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Add borders to header row
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Add committee metadata at the bottom
  const bottomRowNum = sheet.rowCount + 2;
  const typeRow = sheet.getRow(bottomRowNum);
  typeRow.getCell(1).value = 'Committee Type:';
  typeRow.getCell(1).font = { bold: true };
  typeRow.getCell(2).value = committee.type.charAt(0).toUpperCase() + committee.type.slice(1);

  if (committee.description) {
    const descRow = sheet.getRow(bottomRowNum + 1);
    descRow.getCell(1).value = 'Notes:';
    descRow.getCell(1).font = { bold: true };
    descRow.getCell(2).value = committee.description;
  }
}

/**
 * Creates a Faculty sheet listing all faculty and their committee assignments.
 * Useful for a complete overview of faculty and their service.
 */
function createFacultySheet(workbook: ExcelJS.Workbook, projectState: ProjectState): void {
  const sheet = workbook.addWorksheet('Faculty');

  // Define headers
  const headers = ['Name', 'College', 'Email', 'Status', 'Assignments', 'Comments'];
  const headerRow = sheet.addRow(headers);

  // Format header
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0284C7' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Freeze header
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Set column widths
  sheet.columns = [
    { width: 25 }, // Name
    { width: 30 }, // College
    { width: 25 }, // Email
    { width: 15 }, // Status
    { width: 35 }, // Assignments
    { width: 40 }, // Comments
  ];

  // Add faculty rows
  projectState.faculty.forEach((faculty, index) => {
    // Find committees this faculty is assigned to
    const assignments = projectState.committees
      .filter((c) => c.members.some((m) => m.facultyId === faculty.id))
      .map((c) => c.name)
      .join(', ') || 'None';

    // Format status
    let status = 'Wants assignment';
    if (faculty.optOutStatus === 'opted-out') {
      status = 'Opted Out';
    } else if (faculty.optOutStatus === 'exempt') {
      status = 'Exempt';
    }

    const row = sheet.addRow([
      `${faculty.firstName} ${faculty.lastName}`,
      faculty.college,
      faculty.email,
      status,
      assignments,
      faculty.comments,
    ]);

    // Alternate colors
    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }

    // Wrap text in comments column for long comments
    row.getCell(6).alignment = { wrapText: true };

    // Add borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Add borders to header
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
}

/**
 * Helper function to capitalize role names for display.
 * Example: 'ex-officio' becomes 'Ex-Officio'
 */
function capitalizeRole(role: string): string {
  return role
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}
