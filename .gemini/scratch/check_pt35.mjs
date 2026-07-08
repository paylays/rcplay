import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8').replace(/\r\n/g, '\n');
const testStarts = [];
const testRegex = /^PRACTICE TEST (\d+)/gm;
let match;
while ((match = testRegex.exec(txtContent)) !== null) {
  if (match.index > 1000) {
    testStarts.push({ num: parseInt(match[1]), index: match.index });
  }
}
testStarts.sort((a, b) => a.index - b.index);

const pt35Start = testStarts.find(t => t.num === 35).index;
const pt35End = testStarts.find(t => t.num === 36).index;
const pt35Content = txtContent.substring(pt35Start, pt35End);

const lines = pt35Content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.match(/^Questions?\s+/i) || line.match(/^4[1234]\./)) {
    console.log(`Line ${i}: ${line}`);
    console.log(`  next lines:`);
    for (let j = 1; j <= 4; j++) {
      console.log(`    +${j}: ${lines[i+j]}`);
    }
  }
}
