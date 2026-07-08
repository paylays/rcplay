import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
const answerKeyStart = txtContent.indexOf('ANSWER KEY');
const mainContent = txtContent.substring(0, answerKeyStart);

// Let's print out the exact string around "PRACTICE TEST 30"
const pt30Idx = mainContent.indexOf('PRACTICE TEST 30');
if (pt30Idx !== -1) {
  console.log("Found PT30 at", pt30Idx);
  const snippet = mainContent.substring(pt30Idx, pt30Idx + 50);
  console.log("Snippet:", JSON.stringify(snippet));
}

// Let's try matching
const ptRegex = /PRACTICE TEST (\d+)[\r\n]+([^\r\n]+)[\r\n]+/g;
let match;
const starts = [];
while ((match = ptRegex.exec(mainContent)) !== null) {
  starts.push({
    num: parseInt(match[1]),
    index: match.index,
    period: match[2].trim()
  });
}
console.log("Starts found:", starts.length);
if (starts.length > 0) {
  console.log(starts.map(s => `PT${s.num} - ${s.period}`).join(', '));
}
