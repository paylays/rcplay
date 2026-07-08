import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TXT_PATH = join(ROOT, 'TOEFL-PBT-Practice-test.txt');
const OUT_PATH = join(ROOT, 'src', 'data', 'questions.ts');

const txtContent = fs.readFileSync(TXT_PATH, 'utf-8').replace(/\r\n/g, '\n');

// Find the start of answer keys (skip TOC)
const actualAkStart = txtContent.indexOf('ANSWER KEY', 1000);
if (actualAkStart === -1) {
  console.error("Could not find ANSWER KEY section");
  process.exit(1);
}
const mainContent = txtContent.substring(0, actualAkStart);
const answerKeySection = txtContent.substring(actualAkStart);

// ─── Parse Answer Keys ──────────────────────────────────────────────
const answerKeys = {};
const akLines = answerKeySection.split('\n');
for (let i = 0; i < akLines.length; i++) {
  const line = akLines[i].trim();
  const ptMatch = line.match(/^PRACTICE TEST (\d+)$/);
  if (ptMatch) {
    const ptNum = parseInt(ptMatch[1]);
    for (let j = i + 1; j < akLines.length; j++) {
      const ansLine = akLines[j].trim();
      if (ansLine && !ansLine.startsWith('PRACTICE TEST') && !ansLine.startsWith('ANSWER KEY')) {
        const answers = ansLine.replace(/\s+/g, '').split('');
        answerKeys[ptNum] = answers;
        break;
      }
    }
  }
}

console.log("Parsed answer keys:", Object.keys(answerKeys).map(k => `PT${k} (${answerKeys[k].length} answers)`).join(', '));

// ─── Parse Practice Tests ───────────────────────────────────────────
const testStarts = [];
const testRegex = /^PRACTICE TEST (\d+)\s*$/gm;
let match;
while ((match = testRegex.exec(mainContent)) !== null) {
  testStarts.push({
    num: parseInt(match[1]),
    index: match.index
  });
}

// Sort test starts by index just in case
testStarts.sort((a, b) => a.index - b.index);

const tests = [];
for (let i = 0; i < testStarts.length; i++) {
  const start = testStarts[i].index;
  const end = i + 1 < testStarts.length ? testStarts[i + 1].index : actualAkStart;
  tests.push({
    num: testStarts[i].num,
    content: mainContent.substring(start, end)
  });
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
  let text = rawLines.join(' ').replace(/\s+/g, ' ').trim();
  
  // Normalize common label typos (using lookbehind to avoid matching existing parentheses)
  text = text.replace(/(?<!\()B\)\s+/g, '(B) ');
  text = text.replace(/(?<!\()C\)\s+/g, '(C) ');
  text = text.replace(/(?<!\()D\)\s+/g, '(D) ');
  text = text.replace(/(?<!\()A\)\s+/g, '(A) ');
  
  // Fix the PT39 Q3 typo where C is labeled (A)
  text = text.replace(/(\(B\).*?)\(A\)(.*?\(D\))/, '$1(C)$2');

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
  
  // If it's a question with "Unable to find options for this question"
  if (text.toLowerCase().includes('unable to find options')) {
    return { A: '', B: '', C: '', D: '' };
  }

  return null;
}

const parsedPracticeTests = [];

for (const test of tests) {
  const tContent = test.content;
  const lines = tContent.split('\n');
  
  // Get period
  let period = '';
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l) {
      // Period is typically the month year line
      if (l.match(/^[a-zA-Z]+\s+\d{4}$/)) {
        period = l;
        break;
      }
    }
  }

  // Indonesian translation of months
  const months = {
    'january': 'Januari',
    'february': 'Februari',
    'march': 'Maret',
    'april': 'April',
    'may': 'Mei',
    'june': 'Juni',
    'july': 'Juli',
    'august': 'Agustus',
    'september': 'September',
    'october': 'Oktober',
    'november': 'November',
    'december': 'Desember'
  };
  const pParts = period.split(/\s+/);
  if (pParts.length === 2) {
    const m = pParts[0].toLowerCase();
    if (months[m]) {
      period = `${months[m]} ${pParts[1]}`;
    }
  }

  // Find all passage group starts
  const pStarts = [];
  const pRegex = /^(Questions?\s+\d+[-–]\d+|Passage\s+\d+)/gmi;
  let pMatch;
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

  const questionGroups = [];
  let globalQIdx = 0;
  const ak = answerKeys[test.num] || [];

  for (let gIdx = 0; gIdx < groups.length; gIdx++) {
    const group = groups[gIdx];
    let startQNum = 1;
    const rangeMatch = group.header.match(/(\d+)[-–]\d+/);
    if (rangeMatch) {
      startQNum = parseInt(rangeMatch[1]);
    }

    const qLines = group.content.split('\n');
    let firstQLineIdx = -1;
    for (let i = 0; i < qLines.length; i++) {
      if (qLines[i].trim().match(/^\d+\.\s+/)) {
        firstQLineIdx = i;
        break;
      }
    }

    if (firstQLineIdx === -1) {
      console.error(`Error: Could not find starting question ${startQNum} for PT${test.num} Group ${group.header}`);
      process.exit(1);
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
          text: qMatch[2].replace(/Unable to find options for this question/i, '').trim(),
          rawLines: []
        };
      } else if (currentQ) {
        const cleaned = cleanLine(trimmed);
        // Ignore lines that are empty or only contain question marks/spaces
        if (cleaned && cleaned.replace(/[?\s]/g, '') !== '') {
          currentQ.rawLines.push(cleaned);
        }
      }
    }
    if (currentQ) {
      questions.push(currentQ);
    }

    const groupQuestions = [];
    for (const q of questions) {
      globalQIdx++;
      let opts = parseOptions(q.rawLines);
      if (!opts) {
        // Fallback for placeholder/empty questions
        opts = { A: '', B: '', C: '', D: '' };
      }

      const correctAnswer = ak[globalQIdx - 1] || 'A';
      groupQuestions.push({
        id: `PT${test.num}_Q${globalQIdx}`,
        number: globalQIdx,
        text: cleanLine(q.text),
        options: opts,
        correctAnswer
      });
    }

    // Determine passage range
    let passageRange = group.header.replace(/Passage\s+/i, 'Passage ');
    if (group.header.match(/^Passage\s+\d+/i)) {
      // Create a range string like "1-6" based on question numbers
      const startRange = globalQIdx - groupQuestions.length + 1;
      const endRange = globalQIdx;
      passageRange = `${startRange}-${endRange}`;
    } else {
      // Normalize range header, e.g. "Questions 1-7" -> "1-7"
      const rangeOnlyMatch = group.header.match(/Questions?\s+(\d+[-–]\d+)/i);
      if (rangeOnlyMatch) {
        passageRange = rangeOnlyMatch[1];
      }
    }

    questionGroups.push({
      id: `PT${test.num}_G${gIdx + 1}`,
      passageRange,
      passage: cleanPassage(passageLines),
      questions: groupQuestions
    });
  }

  const totalQuestions = questionGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const timerMinutes = Math.round((totalQuestions / 50) * 55);

  parsedPracticeTests.push({
    id: `PT${test.num}`,
    title: `Practice Test ${test.num}`,
    period,
    num: test.num,
    totalQuestions,
    timerMinutes,
    questionGroups
  });
}

console.log(`Parsed all ${parsedPracticeTests.length} tests successfully!`);

// Write out the TS file
const jsonStr = JSON.stringify(parsedPracticeTests, null, 2);
const output = `// AUTO-GENERATED by scripts/parse-markdown.mjs — DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}
// Source: TOEFL-PBT-Practice-test.txt

import type { PracticeTest } from '../types';

export const PRACTICE_TESTS: PracticeTest[] = ${jsonStr};

export const getTestById = (id: string): PracticeTest | undefined =>
  PRACTICE_TESTS.find(t => t.id === id);
`;

fs.writeFileSync(OUT_PATH, output, 'utf-8');
console.log(`Successfully wrote regenerated questions.ts to ${OUT_PATH}!`);
