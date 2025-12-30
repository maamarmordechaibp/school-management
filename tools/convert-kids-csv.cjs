// Script to convert kids.csv to SQL INSERT statements
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'kids.csv');
const outputPath = path.join(__dirname, '..', 'migrations', '008_students_data.sql');

// Read CSV
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter(line => line.trim());

// Parse header
const header = lines[0].split(',');
console.log('Headers:', header);

// Column indices based on CSV structure:
// 0: נאמען ערשטע לעצטע (Hebrew full name)
// 1: First last Name (English full name)
// 2: ערשטע נאמען (Hebrew first name)
// 3: לעצטע נאמען (Hebrew last name)
// 4: First name
// 5: Last name
// 6: טאטעס נאמען מיט טיטל (Father's name with title - Hebrew)
// 7: Fathers First last name with title
// 8: DOB
// 9: Fathers first name
// 10: טאטעס ערשטע נאמען (Father's first name Hebrew)
// 11: מאמעס נאמען (Mother's name)
// 12: Address
// 13: City
// 14: State
// 15: ZipCode
// 16: Fathers Cell
// 17: Home
// 18: Mothers Cell
// 19: E-Mail
// 20: Emergency 2
// 21: Emergency 3
// 22: StudentDate.Class

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function escapeSQL(str) {
  if (!str || str === '') return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function parseClass(classStr) {
  // Extract class name like "כיתה ג - ב" -> "ג - ב"
  if (!classStr) return null;
  const match = classStr.match(/כיתה ([א-ת]) - ([א-ת])/);
  if (match) {
    return `${match[1]} - ${match[2]}`;
  }
  return null;
}

function parseDOB(dob) {
  if (!dob || dob === '') return 'NULL';
  // Format: M/D/YYYY -> YYYY-MM-DD
  const parts = dob.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `'${year}-${month}-${day}'`;
  }
  return 'NULL';
}

function cleanPhone(phone) {
  if (!phone || phone === '') return null;
  return phone.replace(/[^\d-()]/g, '').trim() || null;
}

// Generate SQL
let sql = `-- ============================================
-- Students Data Import
-- ============================================
-- Generated from kids.csv
-- Total students: ${lines.length - 1}
-- ============================================

-- ============================================
-- TO CLEAR ALL STUDENTS, RUN:
-- DELETE FROM students;
-- ============================================

`;

// Process each student
const students = [];
for (let i = 1; i < lines.length; i++) {
  const fields = parseCSVLine(lines[i]);
  if (fields.length < 20) continue;
  
  const className = parseClass(fields[22] || fields[fields.length - 1]);
  if (!className) {
    console.log(`Skipping line ${i}: No valid class found`);
    continue;
  }
  
  students.push({
    hebrew_name: fields[0] || null,
    first_name: fields[4] || null,
    last_name: fields[5] || null,
    hebrew_first_name: fields[2] || null,
    hebrew_last_name: fields[3] || null,
    dob: fields[8] || null,
    father_name: fields[9] || null,
    father_hebrew_name: fields[10] || null,
    mother_name: fields[11] || null,
    address: fields[12] || null,
    city: fields[13] || null,
    state: fields[14] || null,
    zip_code: fields[15] || null,
    father_phone: cleanPhone(fields[16]),
    home_phone: cleanPhone(fields[17]),
    mother_phone: cleanPhone(fields[18]),
    email: fields[19] || null,
    emergency_2: cleanPhone(fields[20]),
    emergency_3: cleanPhone(fields[21]),
    class_name: className
  });
}

// Group by class for better organization
const byClass = {};
students.forEach(s => {
  if (!byClass[s.class_name]) byClass[s.class_name] = [];
  byClass[s.class_name].push(s);
});

// Generate INSERT statements
sql += `-- Insert students linked to their classes
`;

Object.keys(byClass).sort().forEach(className => {
  sql += `
-- ${className} (${byClass[className].length} students)
`;
  
  byClass[className].forEach(s => {
    sql += `INSERT INTO students (
  first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  ${escapeSQL(s.first_name)}, ${escapeSQL(s.last_name)}, ${escapeSQL(s.hebrew_name)}, ${parseDOB(s.dob)},
  ${escapeSQL(s.father_name)}, ${escapeSQL(s.mother_name)}, ${escapeSQL(s.address)}, ${escapeSQL(s.city)}, ${escapeSQL(s.zip_code)},
  ${escapeSQL(s.father_phone)}, ${escapeSQL(s.mother_phone)}, ${escapeSQL(s.email)},
  c.id, 'active', CURRENT_DATE
FROM classes c WHERE c.name = '${s.class_name}';
`;
  });
});

sql += `
-- ============================================
-- SUMMARY
-- ============================================
-- Total Students: ${students.length}
-- Classes:
`;

Object.keys(byClass).sort().forEach(className => {
  sql += `--   ${className}: ${byClass[className].length} students\n`;
});

sql += `-- ============================================
`;

// Write SQL file
fs.writeFileSync(outputPath, sql);
console.log(`Generated ${outputPath}`);
console.log(`Total students: ${students.length}`);
console.log('By class:');
Object.keys(byClass).sort().forEach(className => {
  console.log(`  ${className}: ${byClass[className].length}`);
});
