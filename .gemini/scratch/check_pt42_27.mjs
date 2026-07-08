import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8').replace(/\r\n/g, '\n');
const start = txtContent.indexOf('PRACTICE TEST 42\nDecember 1995');
const next = txtContent.indexOf('PRACTICE TEST 43');
const section = txtContent.substring(start, next);

const lines = section.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.match(/^2[56789]\./) || line.includes('27.')) {
    console.log(`${i}: ${line}`);
    console.log(`  next line: ${lines[i+1]}`);
  }
}
