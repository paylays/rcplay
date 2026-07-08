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

const pt46Start = testStarts.find(t => t.num === 46).index;
const pt46Content = txtContent.substring(pt46Start); // Last test

const pStarts = [];
const pRegex = /^(Questions?\s+\d+[-–]\d+|Passage\s+\d+)/gmi;
let pMatch;
while ((pMatch = pRegex.exec(pt46Content)) !== null) {
  pStarts.push({ header: pMatch[1], index: pMatch.index });
}

const groups = [];
for (let j = 0; j < pStarts.length; j++) {
  const start = pStarts[j].index;
  const end = j + 1 < pStarts.length ? pStarts[j + 1].index : pt46Content.length;
  groups.push({ header: pStarts[j].header, content: pt46Content.substring(start, end) });
}

for (let gIdx = 0; gIdx < groups.length; gIdx++) {
  const group = groups[gIdx];
  console.log(`\n=== PT46 Group ${gIdx + 1} (${group.header}) ===`);
  const qLines = group.content.split('\n');
  
  // Find where questions start (1.)
  let firstQLineIdx = -1;
  for (let i = 0; i < qLines.length; i++) {
    if (qLines[i].trim().match(/^1\.\s+/)) {
      firstQLineIdx = i;
      break;
    }
  }
  
  if (firstQLineIdx === -1) {
    console.log("No questions found!");
    continue;
  }
  
  const questionsSection = qLines.slice(firstQLineIdx);
  const questions = [];
  let currentQ = null;
  for (const line of questionsSection) {
    const trimmed = line.trim();
    const qMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (qMatch) {
      if (currentQ) questions.push(currentQ);
      currentQ = { num: qMatch[1], text: qMatch[2], rawLines: [] };
    } else if (currentQ) {
      currentQ.rawLines.push(trimmed);
    }
  }
  if (currentQ) questions.push(currentQ);
  
  for (const q of questions) {
    console.log(`  Q${q.num}: "${q.text}"`);
    console.log(`    rawLines:`, q.rawLines);
  }
}
