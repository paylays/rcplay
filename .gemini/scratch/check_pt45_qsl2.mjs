import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8').replace(/\r\n/g, '\n');

// Find the section for PRACTICE TEST 45
const pMatch = txtContent.match(/PRACTICE TEST 45\nAugust 1994/);
if (!pMatch) {
  console.log("Could not find PRACTICE TEST 45");
  process.exit(1);
}

const pStart = pMatch.index;
const nextPMatch = txtContent.substring(pStart + 20).match(/PRACTICE TEST \d+/);
const end = nextPMatch ? pStart + 20 + nextPMatch.index : txtContent.length;

const section = txtContent.substring(pStart, end);
const qLines = section.split('\n');

// Find where Passage 1 starts and where the first question starts
let firstQLineIdx = -1;
for (let i = 0; i < qLines.length; i++) {
  if (qLines[i].trim().match(/^1\.\s+/)) {
    firstQLineIdx = i;
    break;
  }
}

console.log("firstQLineIdx:", firstQLineIdx);
const questionsSectionLines = qLines.slice(firstQLineIdx);
for (let i = 0; i < 15; i++) {
  console.log(`${i}: [${questionsSectionLines[i]}]`);
}
