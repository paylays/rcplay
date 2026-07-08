import fs from 'fs';
const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
const answerKeyStart = txtContent.indexOf('ANSWER KEY');
const mainContent = txtContent.substring(0, answerKeyStart);

const ptPattern = /PRACTICE TEST (\d+)/g;
let match;
const starts = [];
while ((match = ptPattern.exec(mainContent)) !== null) {
  starts.push({
    num: match[1],
    index: match.index
  });
}
console.log("Found matches:", starts.length);
for (const s of starts.slice(0, 5)) {
  const snippet = mainContent.substring(s.index, s.index + 50);
  console.log(`PT${s.num}: ${JSON.stringify(snippet)}`);
}
