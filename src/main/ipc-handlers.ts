/**
 * IPC (Inter-Process Communication) Handlers for Electron
 *
 * This module defines all communication between the Electron main process and
 * the React renderer process. The main process handles file I/O, while the
 * renderer shows the UI and sends user actions to main.
 *
 * Communication flow:
 * User clicks button in React UI → sends IPC message → main process handles it →
 * processes file/data → returns result → React UI updates
 *
 * All handlers include error handling to provide user-friendly messages.
 */

import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {
  ImportResult,
  ExportResult,
  FileOperationResult,
  ProjectState,
} from '../shared/types';
import { parseQualtricsCsv, validateCsvStructure } from './utils/csv-parser';
import { saveProject, loadProject, createBackup } from './utils/json-storage';
import { exportToExcel } from './utils/excel-exporter';

/**
 * Registers all IPC handlers with the Electron ipcMain.
 * Should be called once when the app starts.
 *
 * @param mainWindow - The Electron BrowserWindow to send messages back to
 */
export function registerIpcHandlers(mainWindow: Electron.BrowserWindow): void {
  /**
   * Handler: import-csv
   * Opens a file dialog to let user select a CSV file, then parses it.
   * Returns faculty data and committees found in the survey.
   */
  ipcMain.handle('import-csv', async () => {
    try {
      // Open file dialog to let user choose CSV file
      // Filter to show only CSV files by default
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        defaultPath: require('os').homedir(), // Start in home directory
      });

      // If user clicked Cancel, return empty result
      if (canceled || filePaths.length === 0) {
        return {
          faculty: [],
          committees: [],
          warnings: [],
          importedCount: 0,
        } as ImportResult;
      }

      const csvPath = filePaths[0];

      // Read the CSV file
      const csvContent = fs.readFileSync(csvPath, 'utf-8');

      // Validate CSV structure before parsing
      const validation = validateCsvStructure(csvContent);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Parse the CSV and extract faculty data
      const result = parseQualtricsCsv(csvContent);

      return result;
    } catch (error) {
      // Return error with helpful message
      throw error instanceof Error ? error.message : String(error);
    }
  });

  /**
   * Handler: export-excel
   * Generates an Excel workbook from the current project state and saves it.
   * User picks the save location via file dialog.
   */
  ipcMain.handle('export-excel', async (event, projectState: ProjectState) => {
    try {
      // Open save dialog to let user choose where to save the Excel file
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        // Default filename: academicYear-committee-assignments.xlsx
        defaultPath: path.join(
          require('os').homedir(),
          `${projectState.academicYear}-committee-assignments.xlsx`
        ),
      });

      // If user clicked Cancel, return
      if (canceled || !filePath) {
        return {
          success: false,
          error: 'Export cancelled',
        } as ExportResult;
      }

      // Generate the Excel file
      // exportToExcel is async because it writes to disk
      await exportToExcel(projectState, filePath);

      return {
        success: true,
        filePath,
        sheetsCreated: projectState.committees.length + 2, // +2 for Summary and Faculty sheets
      } as ExportResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as ExportResult;
    }
  });

  /**
   * Handler: save-project
   * Saves the current project state to a JSON file.
   * User picks the save location via file dialog.
   */
  ipcMain.handle('save-project', async (event, projectState: ProjectState) => {
    try {
      // Default save location: Documents/FacultyCommittee/{academicYear}.json
      const documentsDir = path.join(require('os').homedir(), 'Documents');
      const defaultDir = path.join(documentsDir, 'FacultyCommittee');
      const defaultFilename = `${projectState.academicYear}-assignments.json`;

      // Open save dialog
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        defaultPath: path.join(defaultDir, defaultFilename),
      });

      // User cancelled
      if (canceled || !filePath) {
        return {
          success: false,
          error: 'Save cancelled',
        } as FileOperationResult;
      }

      // Create a backup of existing file if it exists
      // This prevents accidental data loss if overwriting
      if (fs.existsSync(filePath)) {
        createBackup(filePath);
      }

      // Save the project
      const result = saveProject(projectState, filePath);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as FileOperationResult;
    }
  });

  /**
   * Handler: load-project
   * Opens a JSON project file that was previously saved.
   * User picks the file via file dialog.
   */
  ipcMain.handle('load-project', async () => {
    try {
      // Open file dialog to select JSON file
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        defaultPath: path.join(require('os').homedir(), 'Documents', 'FacultyCommittee'),
      });

      // User cancelled
      if (canceled || filePaths.length === 0) {
        return {
          success: false,
          error: 'Load cancelled',
        } as FileOperationResult;
      }

      const jsonPath = filePaths[0];

      // Load and validate the project
      const result = loadProject(jsonPath);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as FileOperationResult;
    }
  });

  /**
   * Handler: open-file-dialog
   * Generic file open dialog for browsing/selecting files.
   * Used for tasks like "select previous year's project"
   */
  ipcMain.handle(
    'open-file-dialog',
    async (event, options?: { defaultPath?: string; filters?: any[] }) => {
      try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
          properties: ['openFile'],
          filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
          defaultPath:
            options?.defaultPath || path.join(require('os').homedir(), 'Documents'),
        });

        if (canceled || filePaths.length === 0) {
          return null;
        }

        return filePaths[0];
      } catch (error) {
        throw error instanceof Error ? error.message : String(error);
      }
    }
  );

  /**
   * Handler: get-user-data-path
   * Returns the path where user data should be stored.
   * Used by React UI to remember certain settings.
   */
  ipcMain.handle('get-user-data-path', async () => {
    try {
      return require('electron').app.getPath('userData');
    } catch (error) {
      throw error instanceof Error ? error.message : String(error);
    }
  });

  /**
   * Handler: error-log
   * Logs errors from the renderer process to the console or file.
   * Useful for debugging issues that occur in the UI.
   */
  ipcMain.on('error-log', (event, errorMessage: string) => {
    console.error('[Renderer Error]:', errorMessage);
    // In production, could log to file or error tracking service
  });
}
