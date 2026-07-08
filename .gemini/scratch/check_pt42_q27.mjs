import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8').replace(/\r\n/g, '\n');
const start = txtContent.indexOf('PRACTICE TEST 42\nDecember 1995');
const next = txtContent.indexOf('PRACTICE TEST 43');
const section = txtContent.substring(start, next);

const lines = section.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('27.')) {
    console.log(`Line ${i}:`);
    for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 8); j++) {
      console.log(`  ${j}: ${lines[j]}`);
    }
  }
}
