/**
 * Electron Main Process Entry Point
 *
 * This file is the entry point for the Electron main process, which:
 * 1. Creates the application window
 * 2. Loads the React renderer
 * 3. Manages file dialogs and system interactions
 * 4. Handles IPC communication with the renderer
 *
 * The main process runs in Node.js and has full access to the system,
 * while the renderer process (React) runs in a sandbox for security.
 */

import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';

// Track the window globally so it doesn't get garbage collected
let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main application window.
 * Sets up the window with appropriate configuration for the application.
 */
function createWindow(): void {
  // Calculate the preload script path
  // __dirname is dist/main, so we need to construct the correct path to public/preload.js
  const preloadPath = path.join(__dirname, '../../public/preload.js');

  // Log the path for debugging (will show in console)
  console.log('Preload script path:', preloadPath);
  console.log('Preload script exists:', require('fs').existsSync(preloadPath));

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400, // Width in pixels
    height: 900, // Height in pixels
    minWidth: 900, // Minimum width to prevent UI breaking
    minHeight: 600, // Minimum height
    webPreferences: {
      // Path to preload script that bridges main and renderer processes securely
      preload: preloadPath,
      // Enable sandbox for security (in dev, use --no-sandbox flag if needed)
      sandbox: true,
      // Disable node integration for security (use IPC instead)
      nodeIntegration: false,
      // Disable context isolation is risky, keep it enabled
      contextIsolation: true,
    },
  });

  // Load the React app from webpack dev server in development or from dist in production
  if (process.env.NODE_ENV === 'development') {
    // Development: load from webpack dev server on port 3000
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools for debugging (remove in production)
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from bundled files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Clean up when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register IPC handlers for communication with renderer
  registerIpcHandlers(mainWindow);
}

/**
 * App event: when Electron has finished initialization.
 * This is the right place to create windows.
 */
app.on('ready', () => {
  createWindow();

  // Create application menu (removes default menu if desired)
  // Comment out the createMenu call if you want the default menu
  createMenu();
});

/**
 * App event: when all windows are closed, quit the app.
 * This is standard behavior for applications on macOS and Windows.
 */
app.on('window-all-closed', () => {
  // On macOS, applications typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * App event: when the app is activated (clicked on dock on macOS).
 * On macOS, re-create the window when the app is re-activated.
 */
app.on('activate', () => {
  // If no windows are open, create one
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Creates a custom application menu.
 * Customize this based on what menu items you want in your app.
 */
function createMenu(): void {
  // Define menu structure
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            // Could open an about dialog here
          },
        },
      ],
    },
  ];

  // Build the menu from the template
  const menu = Menu.buildFromTemplate(template);
  // Set it as the application menu
  Menu.setApplicationMenu(menu);
}
