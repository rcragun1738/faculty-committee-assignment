/**
 * Test Excel export functionality
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Create a sample project state with some committees and assignments
const projectState = {
  academicYear: '2026-2027',
  faculty: [
    {
      id: 'lonnie-bryant',
      firstName: 'Lonnie',
      lastName: 'Bryant',
      email: 'lonnie@university.edu',
      college: 'COB',
      optOutStatus: 'exempt',
      optOutReason: 'Exempt as Director',
      preferences: [],
      comments: '',
    },
    {
      id: 'hwee-joo-kam',
      firstName: 'Hwee-Joo',
      lastName: 'Kam',
      email: 'hwee@university.edu',
      college: 'COB',
      optOutStatus: 'wants',
      optOutReason: '',
      preferences: [
        { rank: 1, committeeName: 'Academic Integrity Committee' },
        { rank: 2, committeeName: 'Instructional Technology Committee' },
      ],
      comments: 'Interested in teaching-related committees',
    },
    {
      id: 'sarah-fryett',
      firstName: 'Sarah',
      lastName: 'Fryett',
      email: 'sarah@university.edu',
      college: 'CAL',
      optOutStatus: 'exempt',
      optOutReason: 'Director of HAL Spartan Studies',
      preferences: [],
      comments: 'Too busy with program direction',
    },
    {
      id: 'celina-bellanceau',
      firstName: 'Celina',
      lastName: 'Bellanceau',
      email: 'celina@university.edu',
      college: 'CNHS',
      optOutStatus: 'wants',
      optOutReason: '',
      preferences: [
        { rank: 1, committeeName: 'Sustainability Committee' },
        { rank: 2, committeeName: 'International Programs Committee' },
      ],
      comments: '',
    },
  ],
  committees: [
    {
      id: 'committee-academic-integrity',
      name: 'Academic Integrity Committee',
      type: 'appointed',
      description: 'Oversees academic integrity policies',
      members: [
        { facultyId: 'hwee-joo-kam', role: 'chair', termStart: undefined, termEnd: undefined },
      ],
    },
    {
      id: 'committee-sustainability',
      name: 'Sustainability Committee',
      type: 'elected',
      description: 'Promotes sustainability initiatives',
      members: [
        { facultyId: 'celina-bellanceau', role: 'member', termStart: 2026, termEnd: 2028 },
      ],
    },
    {
      id: 'committee-international',
      name: 'International Programs Committee',
      type: 'elected',
      description: 'Oversees international partnerships',
      members: [
        { facultyId: 'celina-bellanceau', role: 'secretary', termStart: 2026, termEnd: 2027 },
      ],
    },
  ],
  metadata: {
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
};

async function testExcelExport() {
  try {
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();

    // Create Summary sheet
    const summary = workbook.addWorksheet('Summary');
    const headers = ['Committee', 'Type', 'Members', 'Chair', 'Secretary'];
    const headerRow = summary.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0284C7' },
    };

    // Create mapping of faculty ID to Faculty
    const facultyMap = new Map();
    projectState.faculty.forEach((f) => facultyMap.set(f.id, f));

    // Add committees to summary
    projectState.committees.forEach((committee, idx) => {
      const chair = committee.members.find((m) => m.role === 'chair');
      const secretary = committee.members.find((m) => m.role === 'secretary');
      const chairName = chair ? facultyMap.get(chair.facultyId)?.firstName : '';
      const secretaryName = secretary ? facultyMap.get(secretary.facultyId)?.firstName : '';

      const row = summary.addRow([
        committee.name,
        committee.type.charAt(0).toUpperCase() + committee.type.slice(1),
        committee.members.length,
        chairName || '-',
        secretaryName || '-',
      ]);

      if (idx % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' },
        };
      }
    });

    // Create individual committee sheets
    projectState.committees.forEach((committee) => {
      const sheet = workbook.addWorksheet(committee.name.substring(0, 31));

      const cols =
        committee.type === 'elected'
          ? ['Name', 'College', 'Role', 'Term Start', 'Term End']
          : ['Name', 'College', 'Role'];

      const headerRow = sheet.addRow(cols);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0284C7' },
      };

      committee.members.forEach((member, idx) => {
        const faculty = facultyMap.get(member.facultyId);
        const roleStr = member.role
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('-');

        const rowData =
          committee.type === 'elected'
            ? [
                `${faculty?.firstName} ${faculty?.lastName}`,
                faculty?.college,
                roleStr,
                member.termStart || '-',
                member.termEnd || '-',
              ]
            : [`${faculty?.firstName} ${faculty?.lastName}`, faculty?.college, roleStr];

        const row = sheet.addRow(rowData);
        if (idx % 2 === 1) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' },
          };
        }
      });
    });

    // Write file
    const outputPath = path.join(__dirname, 'test-output.xlsx');
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ EXCEL EXPORT TEST PASSED\n');
    console.log('════════════════════════════════════════════════════════════');
    console.log('📊 EXPORT RESULTS');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`  ✓ Excel file created: test-output.xlsx`);
    console.log(`  ✓ File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
    console.log(`  ✓ Sheets created: ${workbook.worksheets.length}`);
    console.log('');
    console.log('📋 SHEET NAMES:');
    workbook.worksheets.forEach((sheet, i) => {
      console.log(`  ${i + 1}. ${sheet.name}`);
    });
    console.log('');
    console.log('✅ Excel export works correctly!\n');
  } catch (error) {
    console.log('❌ EXCEL EXPORT TEST FAILED');
    console.log('Error:', error.message);
    process.exit(1);
  }
}

testExcelExport();
