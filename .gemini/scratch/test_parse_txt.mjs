import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');

// Find the start of answer keys
const answerKeyStart = txtContent.indexOf('ANSWER KEY', 1000);
const mainContent = txtContent.substring(0, answerKeyStart);

// Split into tests
const testStarts = [];
const testRegex = /^PRACTICE TEST (\d+)/gm;
let match;
while ((match = testRegex.exec(mainContent)) !== null) {
  testStarts.push({
    num: parseInt(match[1]),
    index: match.index
  });
}

const tests = [];
for (let i = 0; i < testStarts.length; i++) {
  const start = testStarts[i].index;
  const end = i + 1 < testStarts.length ? testStarts[i + 1].index : answerKeyStart;
  tests.push({
    num: testStarts[i].num,
    content: mainContent.substring(start, end)
  });
}

console.log(`Found ${tests.length} tests in TXT.`);

// For each test, parse passages and questions
for (const test of tests) {
  // Find all passage starts
  // Passages start with "Question X-Y" or "Questions X-Y" or "Passage X" (case insensitive) at start of line
  const pStarts = [];
  const pRegex = /^(Questions?\s+\d+[-–]\d+|Passage\s+\d+)/gmi;
  let pMatch;
  const tContent = test.content;
  while ((pMatch = pRegex.exec(tContent)) !== null) {
    pStarts.push({
      header: pMatch[1],
      index: pMatch.index
    });
  }

  console.log(`PT${test.num}: Found ${pStarts.length} passage groups.`);

  const groups = [];
  for (let j = 0; j < pStarts.length; j++) {
    const start = pStarts[j].index;
    const end = j + 1 < pStarts.length ? pStarts[j + 1].index : tContent.length;
    groups.push({
      header: pStarts[j].header,
      content: tContent.substring(start, end)
    });
  }

  let totalQ = 0;
  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const group = groups[gIdx];
    // Find questions in this group
    // Questions start with "^\d+\.\s+"
    const qLines = group.content.split(/\r?\n/);
    const questions = [];
    let currentQ = null;

    for (const line of qLines) {
      const trimmed = line.trim();
      const qMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (qMatch) {
        if (currentQ) {
          questions.push(currentQ);
        }
        currentQ = {
          num: parseInt(qMatch[1]),
          text: qMatch[2],
          rawLines: []
        };
      } else if (currentQ) {
        currentQ.rawLines.push(trimmed);
      }
    }
    if (currentQ) {
      questions.push(currentQ);
    }

    console.log(`  Group ${gIdx+1} (${group.header}): ${questions.length} questions parsed.`);
    totalQ += questions.length;
  }
  console.log(`  PT${test.num} Total Questions: ${totalQ}`);
}
