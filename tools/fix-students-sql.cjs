const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'migrations', '008_students_data.sql');
let content = fs.readFileSync(sqlPath, 'utf8');

// Fix the INSERT statements to include 'name' column
const pattern = /INSERT INTO students \(\n  first_name, last_name, hebrew_name, date_of_birth,\n  father_name, mother_name, address, city, zip_code,\n  father_phone, mother_phone, father_email,\n  class_id, status, enrollment_date\n\) SELECT\n  '([^']*)', '([^']*)',/g;

const fixed = content.replace(pattern, (match, firstName, lastName) => {
  const fullName = firstName + ' ' + lastName;
  return `INSERT INTO students (
  name, first_name, last_name, hebrew_name, date_of_birth,
  father_name, mother_name, address, city, zip_code,
  father_phone, mother_phone, father_email,
  class_id, status, enrollment_date
) SELECT
  '${fullName}', '${firstName}', '${lastName}',`;
});

fs.writeFileSync(sqlPath, fixed);
console.log('Fixed INSERT statements to include name column');

// Count how many were fixed
const originalCount = (content.match(/INSERT INTO students/g) || []).length;
const newCount = (fixed.match(/INSERT INTO students/g) || []).length;
console.log(`Total INSERT statements: ${newCount}`);
