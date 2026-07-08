import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
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

const rawTests = [];
for (let i = 0; i < testStarts.length; i++) {
  const start = testStarts[i].index;
  const end = i + 1 < testStarts.length ? testStarts[i + 1].index : answerKeyStart;
  rawTests.push({
    num: testStarts[i].num,
    content: mainContent.substring(start, end)
  });
}

// Ignore TOC tests (those that have 0 passage groups)
const tests = [];
for (const rawTest of rawTests) {
  const pRegex = /^(Questions?\s+\d+[-–]\d+|Passage\s+\d+)/gmi;
  if (pRegex.test(rawTest.content)) {
    tests.push(rawTest);
  }
}

function cleanLine(line) {
  return line
    .replace(/^Line\s+/g, '')
    .replace(/^\(\d+\)\s*/g, '')
    .replace(/\(\d+\)\s*/g, ' ')
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
    .replace(/^\s*\d{1,3}\s*$/, '')
    .trim();
}

function cleanPassage(lines) {
  return lines
    .map(cleanLine)
    .filter(l => l.length > 0)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanOptionText(str) {
  return str
    .replace(/^[-*\s.]+/, '')
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseOptions(rawLines) {
  const text = rawLines.join(' ').replace(/\s+/g, ' ').trim();
  const regex = /\(A\)\s*([\s\S]*?)\(B\)\s*([\s\S]*?)\(C\)\s*([\s\S]*?)\(D\)\s*([\s\S]*)/;
  const match = text.match(regex);
  if (match) {
    return {
      A: cleanOptionText(match[1]),
      B: cleanOptionText(match[2]),
      C: cleanOptionText(match[3]),
      D: cleanOptionText(match[4])
    };
  }
  const aIdx = text.indexOf('(A)');
  const bIdx = text.indexOf('(B)');
  const cIdx = text.indexOf('(C)');
  const dIdx = text.indexOf('(D)');
  if (aIdx !== -1 && bIdx !== -1 && cIdx !== -1 && dIdx !== -1) {
    return {
      A: cleanOptionText(text.substring(aIdx + 3, bIdx)),
      B: cleanOptionText(text.substring(bIdx + 3, cIdx)),
      C: cleanOptionText(text.substring(cIdx + 3, dIdx)),
      D: cleanOptionText(text.substring(dIdx + 3))
    };
  }
  return null;
}

let totalParsedQuestions = 0;
let failedOptionsCount = 0;

for (const test of tests) {
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

  const groups = [];
  for (let j = 0; j < pStarts.length; j++) {
    const start = pStarts[j].index;
    const end = j + 1 < pStarts.length ? pStarts[j + 1].index : tContent.length;
    groups.push({
      header: pStarts[j].header,
      content: tContent.substring(start, end)
    });
  }

  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const group = groups[gIdx];
    // Find the starting question number
    let startQNum = 1;
    const rangeMatch = group.header.match(/(\d+)[-–]\d+/);
    if (rangeMatch) {
      startQNum = parseInt(rangeMatch[1]);
    }

    const qLines = group.content.split(/\r?\n/);
    
    // Find where questions start
    let firstQLineIdx = -1;
    for (let i = 0; i < qLines.length; i++) {
      if (qLines[i].trim().match(new RegExp(`^${startQNum}\\.\\s+`))) {
        firstQLineIdx = i;
        break;
      }
    }

    if (firstQLineIdx === -1) {
      console.log(`Warning: could not find starting question ${startQNum} for PT${test.num} Group ${group.header}`);
      continue;
    }

    const passageLines = qLines.slice(1, firstQLineIdx);
    const questionsSectionLines = qLines.slice(firstQLineIdx);

    const questions = [];
    let currentQ = null;

    for (const line of questionsSectionLines) {
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

    for (const q of questions) {
      totalParsedQuestions++;
      const opts = parseOptions(q.rawLines);
      if (!opts || !opts.A || !opts.B || !opts.C || !opts.D) {
        console.log(`Failed to parse options for PT${test.num} Q${q.num}:`, q.rawLines);
        failedOptionsCount++;
      }
    }
  }
}

console.log(`\nTotal parsed questions: ${totalParsedQuestions}`);
console.log(`Failed to parse options: ${failedOptionsCount}`);
