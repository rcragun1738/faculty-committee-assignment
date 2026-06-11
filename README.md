# Faculty Committee Assignment Tool

A cross-platform desktop application for managing faculty committee assignments. Built with Electron, React, and TypeScript for Windows, macOS, and Linux.

## Overview

This tool streamlines the annual process of assigning faculty to university committees. It allows administrators to:

1. **Import survey data** from Qualtrics CSV exports
2. **Manage faculty** - add, edit, or remove faculty members
3. **Configure committees** - create committees, set type (elected/appointed), and manage properties
4. **Assign faculty** - intuitively assign faculty to committees with drag-and-drop or button-based interface
5. **Export results** - generate professional Excel workbooks and save projects for year-to-year continuity

## Features

### Data Management
- **CSV Import**: Load faculty preferences directly from Qualtrics survey exports
- **Manual Faculty Entry**: Add faculty who didn't complete the survey
- **Committee Management**: Create, edit, and delete committees with customizable properties
- **Committee Types**: Distinguish between elected and appointed committees with configurable term lengths

### Assignment Interface
- **Faculty Assignment**: Assign faculty to committees with click-based interface
- **Role Management**: Assign roles (member, chair, secretary, ex-officio) to committee members
- **Term Dates**: Set service term dates for elected committee members (academic year format)
- **Unassigned Tracking**: View at-a-glance which faculty still need assignments

### Output
- **Excel Export**: Generate professional Excel workbooks with:
  - One sheet per committee showing member details
  - Summary sheet with committee overview
  - Faculty sheet listing all assignments
  - Professional formatting (colors, bold headers, frozen rows)
- **JSON Save/Load**: Save projects as JSON files for next year's starting point

### User Experience
- **Dark/Light Theme**: Toggle between dark and light mode with localStorage persistence
- **Professional UI**: Clean, accessible interface built with React and Tailwind CSS
- **Responsive Design**: Works on different screen sizes
- **Cross-Platform**: Runs identically on Windows, macOS, and Linux

## Installation

### Prerequisites
- Node.js 16+ and npm 8+
- Electron 27+

### For End Users

Download the installer for your operating system:
- **Windows**: `Faculty-Committee-Assignment-Setup.msi`
- **macOS**: `Faculty-Committee-Assignment.dmg`
- **Linux**: `Faculty-Committee-Assignment.AppImage` or `.deb`

### For Developers

1. **Clone or download the project**
   ```bash
   cd /path/to/faculty-committee-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```
   
   This starts both the Webpack dev server (React) and watches the main process.

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Create installers** (requires platform-specific tools)
   ```bash
   npm run package
   # Or for specific platforms:
   npm run package:windows
   npm run package:mac
   npm run package:linux
   ```

## Usage Guide

### Step 1: Import Faculty

1. Click "1. Import Faculty" tab
2. Click "Select CSV File" to import your Qualtrics survey results
3. Review the imported faculty list
4. Manually add any faculty who didn't complete the survey
5. Remove faculty if needed (e.g., departed faculty)
6. Click "Continue to Committees" when ready

**Note**: The CSV must be exported from Qualtrics with the standard survey structure. The tool will validate the file format.

### Step 2: Manage Committees

1. Click "2. Manage Committees" tab
2. Enter committee names in the "Add New Committee" form
3. Select committee type:
   - **Appointed**: Members serve indefinitely
   - **Elected**: Members serve specified term lengths
4. Add optional descriptions
5. Delete committees if needed
6. Click "Continue to Assignments" when ready

### Step 3: Assign Faculty

1. Click "3. Assign Faculty" tab
2. Click a faculty name on the left to select them
3. Click "Assign to [Committee]" button on the right
4. View assigned members in each committee
5. Edit member details:
   - Click "Edit" button next to a member name
   - Change role (member, chair, secretary, ex-officio)
   - Set term dates (for elected committees)
6. Remove members by clicking "Remove"
7. Click "Continue to Export" when done

### Step 4: Export & Save

1. Click "4. Export & Save" tab
2. Review assignment statistics
3. **Export to Excel**: Creates a professional workbook with one sheet per committee
4. **Save Project**: Saves the project as JSON for next year's starting point
5. Open the Excel file, make any final edits, print to PDF if desired

## Project Structure

```
faculty-committee-assignment/
├── src/
│   ├── main/                       # Electron main process
│   │   ├── index.ts               # Application entry point
│   │   ├── ipc-handlers.ts        # IPC communication handlers
│   │   └── utils/
│   │       ├── csv-parser.ts      # Qualtrics CSV parsing
│   │       ├── excel-exporter.ts  # Excel file generation
│   │       └── json-storage.ts    # Project save/load
│   ├── renderer/                   # React application
│   │   ├── App.tsx                # Main app component
│   │   ├── pages/                 # Page components
│   │   │   ├── ImportPage.tsx
│   │   │   ├── CommitteePage.tsx
│   │   │   ├── AssignmentPage.tsx
│   │   │   └── ExportPage.tsx
│   │   ├── components/            # Reusable components
│   │   │   └── ThemeToggle.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useAppState.ts    # Global state management
│   │   │   └── useTheme.ts       # Dark/light mode
│   │   ├── styles/
│   │   │   └── tailwind.css      # Tailwind CSS entry point
│   │   └── index.tsx             # React entry point
│   └── shared/
│       └── types.ts              # Shared TypeScript interfaces
├── public/
│   ├── index.html                # HTML template
│   └── preload.ts                # Electron preload script
├── package.json
├── tsconfig.json
├── webpack.main.js
├── webpack.renderer.js
├── tailwind.config.js
├── postcss.config.js
└── README.md (this file)
```

## Data Format

### CSV Import Format

The application expects CSV files exported from Qualtrics with the following columns:
- `firstname` - Faculty first name
- `lastname` - Faculty last name
- `college` - College/department
- `optout` - Whether faculty wants committee service (parsed from survey response)
- `exempt` - Exemption status and reason
- `committeepref_*_*_RANK` - Committee preferences (Qualtrics native format)
- `comments` - Faculty comments on committee choices

The tool automatically maps Qualtrics committee codes to names.

### JSON Project Format

Projects are saved as JSON files containing:
```json
{
  "academicYear": "2026-2027",
  "faculty": [...],
  "committees": [...],
  "metadata": {
    "createdDate": "2026-04-15T14:30:00Z",
    "lastModified": "2026-06-15T10:45:00Z",
    "previousYearPath": "/path/to/previous/year.json"
  }
}
```

## Customization for Future Years

### Adding New Committees

New committees can be added:
1. Via the Committee Management tab (Step 2)
2. By updating the `COMMITTEE_CODE_MAP` in `src/main/utils/csv-parser.ts` if they appear in the Qualtrics survey

### Updating Committee Mapping

If Qualtrics survey structure changes, update the committee code mapping in `csv-parser.ts`:
```typescript
const COMMITTEE_CODE_MAP: Record<string, string> = {
  '53': 'Academic Appeals Committee',
  // ... update codes as needed
};
```

### Theming

Colors and theme configuration can be customized in:
- `tailwind.config.js` - Color palette and design tokens
- `src/renderer/styles/tailwind.css` - Additional global styles

## Troubleshooting

### CSV Import Errors
- **"CSV file is empty"**: Ensure the file contains data rows
- **"Missing required columns"**: Export the survey from Qualtrics with all questions visible

### Excel Export Issues
- **"Permission denied"**: Ensure the save location is writable
- **Missing sheets**: Verify committees were created before exporting

### Dark Mode Not Persisting
- Clear browser cache/localStorage
- Check that localStorage is enabled in browser settings

## Development Notes

### Code Philosophy

This codebase prioritizes:
- **Readability**: Heavy commenting explains the "why" behind decisions
- **Maintainability**: Clear file structure and naming conventions
- **Extensibility**: Modular components that can be easily extended
- **Type Safety**: Full TypeScript with strict type checking
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

### Adding Features

When adding features:
1. Add TypeScript interfaces to `src/shared/types.ts`
2. Add state management to `useAppState` hook if needed
3. Create page or component in appropriate directory
4. Update App.tsx if adding new pages
5. Add comprehensive comments explaining the feature
6. Test cross-platform if possible

### Building for Deployment

```bash
# Build all assets
npm run build

# Create installers for all platforms
npm run package

# Or specific platform
npm run package:windows
npm run package:mac
npm run package:linux
```

Installer files are created in the `out` directory.

## Support & Maintenance

### Common Questions

**Q: How do I load last year's assignments?**
A: Click "4. Export & Save" → "Continue from Previous Year" (currently manual via JSON file). Load the saved JSON from last year as a starting point.

**Q: Can I edit the Excel file after exporting?**
A: Yes! The Excel file is a standard .xlsx that can be opened in Excel, Google Sheets, LibreOffice, etc. Make edits and save.

**Q: How do I back up my work?**
A: Use "Save Project" to create a JSON backup. Multiple backup files can be saved with different names.

## License

This application is provided as-is for use by the University Faculty Senate. Modify as needed for your institution's requirements.

## Version History

### 1.0.0 (June 2026)
- Initial release
- CSV import from Qualtrics
- Faculty and committee management
- Assignment interface
- Excel export
- JSON project save/load
- Dark/light theme support
- Cross-platform (Windows, macOS, Linux)
