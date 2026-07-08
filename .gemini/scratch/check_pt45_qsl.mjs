import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
const pStart = txtContent.indexOf('PRACTICE TEST 45\r\nAugust 1994');
const nextP = txtContent.indexOf('PRACTICE TEST 46');
const section = txtContent.substring(pStart, nextP);

const qLines = section.split(/\r?\n/);
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
