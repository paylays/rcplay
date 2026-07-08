import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
const pStart = txtContent.indexOf('PRACTICE TEST 45\r\nAugust 1994');
const nextP = txtContent.indexOf('PRACTICE TEST 46');
const section = txtContent.substring(pStart, nextP);

const lines = section.split(/\r?\n/);
for (let i = 0; i < 40; i++) {
  console.log(`${i}: [${lines[i]}]`);
}
