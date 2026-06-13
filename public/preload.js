/**
 * Electron Preload Script (JavaScript version)
 *
 * This script runs in a special context with access to both Electron APIs and the
 * renderer process. It securely exposes specific IPC functions to the React app.
 *
 * Security consideration: Instead of exposing the entire ipcRenderer, we only expose
 * the specific functions the React app needs. This follows the principle of least privilege.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose a limited set of IPC functions to the renderer process.
 * Each function is wrapped to safely communicate with the main process.
 *
 * Access these in React using: window.electron.importCsv(), etc.
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * Import a CSV file from the Qualtrics survey.
   * Opens file dialog and returns parsed faculty data.
   */
  importCsv: () => ipcRenderer.invoke('import-csv'),

  /**
   * Export the current project to an Excel workbook.
   * Shows save dialog and creates formatted Excel file.
   *
   * @param projectState - The complete project state to export
   * @param sheetOrder - How to order the committee sheets ('as-listed' | 'alphabetical' | 'by-type')
   */
  exportExcel: (projectState, sheetOrder) =>
    ipcRenderer.invoke('export-excel', projectState, sheetOrder),

  /**
   * Save the current project to a JSON file.
   * Shows save dialog and writes project state as JSON.
   *
   * @param projectState - The complete project state to save
   */
  saveProject: (projectState) => ipcRenderer.invoke('save-project', projectState),

  /**
   * Load a previously saved project from a JSON file.
   * Opens file dialog and loads project state.
   */
  loadProject: () => ipcRenderer.invoke('load-project'),

  /**
   * Open a generic file dialog.
   * Used for selecting files like "previous year's project"
   *
   * @param options - Configuration for the dialog (defaultPath, filters, etc.)
   */
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),

  /**
   * Get the path where user data should be stored.
   * Useful for remembering settings between sessions.
   */
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  /**
   * Send error messages from the React app to the main process for logging.
   * Useful for debugging issues in the renderer.
   *
   * @param errorMessage - The error message to log
   */
  logError: (errorMessage) => ipcRenderer.send('error-log', errorMessage),
});
