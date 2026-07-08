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

const pt42Start = testStarts.find(t => t.num === 42).index;
const pt42End = testStarts.find(t => t.num === 43).index;
const pt42Content = txtContent.substring(pt42Start, pt42End);

const pStarts = [];
const pRegex = /^(Questions?\s+\d+[-–]\d+|Passage\s+\d+)/gmi;
let pMatch;
while ((pMatch = pRegex.exec(pt42Content)) !== null) {
  pStarts.push({ header: pMatch[1], index: pMatch.index });
}

const groups = [];
for (let j = 0; j < pStarts.length; j++) {
  const start = pStarts[j].index;
  const end = j + 1 < pStarts.length ? pStarts[j + 1].index : pt42Content.length;
  groups.push({ header: pStarts[j].header, content: pt42Content.substring(start, end) });
}

// Check Group 3 (where Q27 usually resides: range 22-31)
const group3 = groups[2]; // 0-indexed: group 3
console.log("=== PT42 Group 3 Header ===", group3.header);
const qLines = group3.content.split('\n');
for (let i = 0; i < qLines.length; i++) {
  console.log(`${i}: [${qLines[i]}]`);
}
