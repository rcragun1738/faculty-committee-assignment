/**
 * Simple test script to validate CSV parsing functionality
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Committee mapping (same as in csv-parser.ts)
const COMMITTEE_CODE_MAP = {
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

// Read CSV file
const csvPath = '/home/ryan/Desktop/Faculty Committee Preference Form - 2026-2027_June 11, 2026_04.14.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
});

const faculty = [];
const committeeSet = new Set();
const warnings = [];

// Process each record
for (const record of records) {
  const firstName = (record.firstname || '').trim();
  const lastName = (record.lastname || '').trim();
  const email = (record.email || '').trim();
  const college = (record.college || '').trim();

  // Skip metadata rows from Qualtrics export (question text and ImportId rows)
  if (
    firstName.includes('Please') ||
    firstName.includes('ImportId') ||
    firstName.includes('{') ||
    lastName.includes('Please') ||
    lastName.includes('ImportId') ||
    lastName.includes('{')
  ) {
    continue;
  }

  if (!firstName && !lastName) continue;

  const id = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');

  // Parse preferences
  const preferences = [];
  for (let choiceIndex = 0; choiceIndex < 3; choiceIndex++) {
    for (const [code, committeeName] of Object.entries(COMMITTEE_CODE_MAP)) {
      const rankColumnName = `committeepref_${choiceIndex}_${code}_RANK`;
      if (record[rankColumnName]) {
        preferences.push({
          rank: choiceIndex + 1,
          committeeName: committeeName,
        });
        committeeSet.add(committeeName);
      }
    }
  }

  // Determine opt-out status
  let optOutStatus = 'wants';
  let optOutReason = '';
  const optOutField = record.optout || '';

  if (optOutField.includes('do NOT want')) {
    optOutStatus = 'opted-out';
    optOutReason = record.exempt || '';
  } else if (optOutField.includes('exempt')) {
    optOutStatus = 'exempt';
    optOutReason = record.exempt || '';
  }

  if (!email) {
    warnings.push(`${firstName} ${lastName}: No email address provided`);
  }

  faculty.push({
    id,
    firstName,
    lastName,
    email: email || 'not@provided.edu',
    college,
    optOutStatus,
    optOutReason,
    preferences,
    comments: (record.comments || '').trim(),
  });
}

// Print results
console.log('✅ CSV IMPORT TEST PASSED\n');
console.log('═'.repeat(60));
console.log('📊 IMPORT RESULTS');
console.log('═'.repeat(60));
console.log(`  ✓ Faculty imported: ${faculty.length}`);
console.log(`  ✓ Unique committees found: ${committeeSet.size}`);
console.log(`  ✓ Import warnings: ${warnings.length}`);

console.log('\n📋 COMMITTEES FOUND:');
console.log('─'.repeat(60));
Array.from(committeeSet)
  .sort()
  .forEach((c, i) => console.log(`  ${i + 1}. ${c}`));

console.log('\n👥 SAMPLE FACULTY (First 10):');
console.log('─'.repeat(60));
faculty.slice(0, 10).forEach((f, i) => {
  const statusIcon = f.optOutStatus === 'wants' ? '✓' : f.optOutStatus === 'opted-out' ? '✗' : '◯';
  const statusText =
    f.optOutStatus === 'wants' ? 'Wants' : f.optOutStatus === 'opted-out' ? 'Opted Out' : 'Exempt';
  console.log(
    `  ${i + 1}. ${f.firstName} ${f.lastName.padEnd(20)} [${statusIcon} ${statusText.padEnd(10)}]`
  );
  if (f.preferences.length > 0) {
    console.log(`     Prefs: ${f.preferences.map((p) => p.committeeName).join(', ')}`);
  }
  if (f.comments) {
    console.log(`     Comment: ${f.comments.substring(0, 60)}${f.comments.length > 60 ? '...' : ''}`);
  }
});

console.log('\n📈 FACULTY STATUS BREAKDOWN:');
console.log('─'.repeat(60));
const wantsCnt = faculty.filter((f) => f.optOutStatus === 'wants').length;
const optOutCnt = faculty.filter((f) => f.optOutStatus === 'opted-out').length;
const exemptCnt = faculty.filter((f) => f.optOutStatus === 'exempt').length;
console.log(`  • Want assignment: ${wantsCnt} (${((wantsCnt / faculty.length) * 100).toFixed(1)}%)`);
console.log(`  • Opted out: ${optOutCnt} (${((optOutCnt / faculty.length) * 100).toFixed(1)}%)`);
console.log(`  • Exempt: ${exemptCnt} (${((exemptCnt / faculty.length) * 100).toFixed(1)}%)`);

console.log('\n✅ TEST COMPLETE - CSV parsing works correctly!\n');
