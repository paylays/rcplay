import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8').replace(/\r\n/g, '\n');
const start = txtContent.indexOf('PRACTICE TEST 35', 1000);
const next = txtContent.indexOf('PRACTICE TEST 36', 1000);
const section = txtContent.substring(start, next);

const lines = section.split('\n');
let q5Start = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes('Questions 43-50')) {
    q5Start = true;
  }
  if (q5Start && line.match(/^\d+\./)) {
    console.log(line);
  }
}
