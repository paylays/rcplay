/**
 * parse-markdown.mjs
 * One-time parser: TOEFL-PBT-Practice-test.md → src/data/questions.ts
 * Run: node scripts/parse-markdown.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MD_PATH = join(ROOT, '..', 'TOEFL-PBT-Practice-test.md');
const OUT_PATH = join(ROOT, 'src', 'data', 'questions.ts');

// ─── Answer Keys ──────────────────────────────────────────────────────────────
const ANSWER_KEYS = {
  PT30: 'CDCBC DACBC DDDCC ABBAC DBCAD ABACD BABBC CAABB BBABC AACCD',
  PT31: 'BDADC DACBC CBACD ACDBA DBCAD DBACB CCDDB BDACA BACDA BACCD',
  PT32: 'ABBDC BCCDB BACCD BCDAB BABDD CBACA CBDAA DABCD BCAAB DCADD',
  PT33: 'DBCCD CABAB DCCAC ABBCA BCADC DADCC BDBAA AADDB BBADB CBDDA',
  PT34: 'CBADD CAAAD CBCBC ACABD BADAB ACBCD BDACD CADBA CBDCB CCADA',
  PT35: 'ACBAB CCDDB DBBBC ACDAB CCABD DCABC ADBBA BABCA CBACD AACDC',
  PT36: 'CCACC BCDCC AACDC BDABB DACAD DBBCA AADDC CDBAB AACBB AABDC',
  PT37: 'BDCAD ADCBA DBBDD BBACC DADBC DACBD BCCCD BAABA CCBAC DDDAD',
  PT38: 'CADCAB BDCAC CBACD BCCDAD CACBBCBC',
  PT39: 'ADBACB ABBCAC DAABAD BDDBD BBADDCC',
  PT40: 'DBBDC BACDC BACDA DABAB DADAC DCABD ADCDB BDDAB BDBAD DABCD',
  PT41: 'CCBBA DCADA BDCDD AABDB CCDAD BDBAA DCCCD BAABB DABCC DBCAB',
  PT42: 'BABAD BADAB BCBCD BBADC DCBCD BDADD CCBDD AAADB CDADB BBBCD',
  PT43: 'DCDAB BDABCAB DADBCAB BDDACBA CBBC',
  PT44: 'DABDB CBBAADA DABADC ABDCBA BCDBDA',
  PT45: 'BADDBC DBDA AABDBB BBDCACAA BBCAAD',
  PT46: 'BCCACB CBDDACC CDAB CBBDADB ABCACD',
};

function parseAnswerKey(raw) {
  return raw.replace(/\s/g, '').split('');
}

// ─── Test Metadata ─────────────────────────────────────────────────────────────
const TEST_META = {
  PT30: { title: 'Practice Test 30', period: 'Oktober 1997', num: 30 },
  PT31: { title: 'Practice Test 31', period: 'Desember 1997', num: 31 },
  PT32: { title: 'Practice Test 32', period: 'Januari 1996', num: 32 },
  PT33: { title: 'Practice Test 33', period: '', num: 33 },
  PT34: { title: 'Practice Test 34', period: '', num: 34 },
  PT35: { title: 'Practice Test 35', period: '', num: 35 },
  PT36: { title: 'Practice Test 36', period: 'Oktober 1996', num: 36 },
  PT37: { title: 'Practice Test 37', period: 'Desember 1996', num: 37 },
  PT38: { title: 'Practice Test 38', period: '', num: 38 },
  PT39: { title: 'Practice Test 39', period: '', num: 39 },
  PT40: { title: 'Practice Test 40', period: '', num: 40 },
  PT41: { title: 'Practice Test 41', period: '', num: 41 },
  PT42: { title: 'Practice Test 42', period: '', num: 42 },
  PT43: { title: 'Practice Test 43', period: '', num: 43 },
  PT44: { title: 'Practice Test 44', period: '', num: 44 },
  PT45: { title: 'Practice Test 45', period: '', num: 45 },
  PT46: { title: 'Practice Test 46', period: '', num: 46 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function cleanLine(line) {
  // Remove line number markers like "Line (5)", "(10)", etc.
  let l = line
    .replace(/^Line\s+/g, '')
    .replace(/^\(\d+\)\s*/g, '')
    .replace(/\(\d+\)\s*/g, ' ')
    // Remove Persian/Farsi text
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
    // Remove standalone page numbers
    .replace(/^\s*\d{1,3}\s*$/, '')
    .trim();
  return l;
}

function cleanPassage(lines) {
  return lines
    .map(cleanLine)
    .filter(l => l.length > 0)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Parse inline options: "(A) text (B) text (C) text (D) text"
function parseInlineOptions(str) {
  const opts = { A: '', B: '', C: '', D: '' };
  // Normalize: remove markdown list markers
  const s = str.replace(/^[-*]\s+/, '').trim();

  const re = /\(([ABCD])\)\s*(.*?)(?=\s*\([ABCD]\)|$)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    opts[m[1]] = m[2].trim();
  }
  return opts;
}

// Parse bullet/sub-item options collected from multiple lines
// Input: array of strings like ["text A", "(B) text B", "(C) text C", "(D) text D"]
function parseBulletOptions(bulletLines) {
  const opts = { A: '', B: '', C: '', D: '' };
  
  // Clean all lines and join them to handle inline options
  const cleanLines = bulletLines.map(l => l.replace(/^[-*\s]+/, '').trim());
  
  // Try to parse as single string first
  const fullStr = cleanLines.join(' ');
  
  // If the first option doesn't explicitly start with (A), we assume it's A until (B)
  // Let's normalize it so we can easily parse it
  let normalizedStr = fullStr;
  if (!normalizedStr.startsWith('(A)')) {
    normalizedStr = '(A) ' + normalizedStr;
  }
  
  const re = /\(([ABCD])\)\s*(.*?)(?=\s*\([ABCD]\)|$)/g;
  let m;
  while ((m = re.exec(normalizedStr)) !== null) {
    opts[m[1]] = m[2].trim();
  }
  
  return opts;
}

// ─── Main Parser ───────────────────────────────────────────────────────────────
function parse() {
  const raw = readFileSync(MD_PATH, 'utf-8');
  const lines = raw.split('\n');

  const tests = [];
  let currentTestId = null;
  let currentGroupLines = [];
  let insideAnswerKey = false;

  // We'll collect per-test groups here
  const testGroups = {}; // testId → { groupLines: string[] }[]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect ANSWER KEY section → stop processing
    if (/^#\s+ANSWER KEY/i.test(line)) {
      if (currentTestId && currentGroupLines.length) {
        if (!testGroups[currentTestId]) testGroups[currentTestId] = [];
        testGroups[currentTestId].push([...currentGroupLines]);
        currentGroupLines = [];
      }
      insideAnswerKey = true;
      continue;
    }
    if (insideAnswerKey) continue;

    // Detect new Practice Test heading "# PRACTICE TEST XX"
    const testMatch = line.match(/^#\s+PRACTICE TEST\s+(\d+)/i);
    if (testMatch) {
      // Save previous group if any
      if (currentTestId && currentGroupLines.length) {
        if (!testGroups[currentTestId]) testGroups[currentTestId] = [];
        testGroups[currentTestId].push([...currentGroupLines]);
        currentGroupLines = [];
      }
      currentTestId = `PT${testMatch[1]}`;
      if (!testGroups[currentTestId]) testGroups[currentTestId] = [];
      continue;
    }

    // Detect Question Group heading "### Question X-Y" or "### Questions X-Y"
    const groupMatch = line.match(/^###\s+Questions?\s+(\d+[-–]\d+)/i);
    if (groupMatch && currentTestId) {
      // Save previous group
      if (currentGroupLines.length) {
        testGroups[currentTestId].push([...currentGroupLines]);
        currentGroupLines = [];
      }
      // Start new group with the header
      currentGroupLines = [`__GROUP__${groupMatch[1]}`];
      continue;
    }

    if (currentTestId) {
      currentGroupLines.push(line);
    }
  }

  // Save last group
  if (currentTestId && currentGroupLines.length) {
    if (!testGroups[currentTestId]) testGroups[currentTestId] = [];
    testGroups[currentTestId].push([...currentGroupLines]);
  }

  // ── Now parse each test ──────────────────────────────────────────────────────
  for (const [testId, groups] of Object.entries(testGroups)) {
    const meta = TEST_META[testId];
    if (!meta) continue;
    const answerArray = parseAnswerKey(ANSWER_KEYS[testId] || '');

    const questionGroups = [];
    let globalQuestionNum = 0;

    for (const groupLines of groups) {
      const groupHeader = groupLines[0]?.startsWith('__GROUP__')
        ? groupLines[0].replace('__GROUP__', '')
        : null;
      const bodyLines = groupHeader ? groupLines.slice(1) : groupLines;

      // ── Split passage from questions ──────────────────────────────────────
      // Questions start with "- " (markdown list item)
      let firstQIdx = bodyLines.findIndex(l => /^-\s+/.test(l.trim()));
      if (firstQIdx === -1) firstQIdx = bodyLines.length;

      const passageRawLines = bodyLines.slice(0, firstQIdx);
      const questionRawLines = bodyLines.slice(firstQIdx);

      // Clean passage
      const passageClean = cleanPassage(passageRawLines);

      // Parse passage title from group header (e.g. "1-7" → questions 1-7)
      const rangeMatch = groupHeader?.match(/(\d+)[-–](\d+)/);
      const qStart = rangeMatch ? parseInt(rangeMatch[1]) : globalQuestionNum + 1;

      // ── Parse individual questions from questionRawLines ──────────────────
      const questions = [];
      let i2 = 0;

      while (i2 < questionRawLines.length) {
        const l = questionRawLines[i2];

        // Skip empty lines, page numbers, Persian text, non-question content
        if (!l.trim() || /^#{1,6}/.test(l) || /^[0-9]+\s*$/.test(l.trim())) {
          i2++;
          continue;
        }

        // A question starts with "- " 
        if (/^-\s+/.test(l)) {
          const questionText = l.replace(/^-\s+/, '').trim();

          // Skip if it looks like a sub-option (e.g., starts with "from Baltimore")
          // Real questions typically have more than 20 chars or contain question words
          if (questionText.length < 5) { i2++; continue; }

          // Collect the question text (may span multiple lines via indented continuation)
          let fullQText = questionText;
          i2++;

          // Collect options
          let optionLines = [];
          let nextQIdx = i2;

          // Look ahead for options
          while (nextQIdx < questionRawLines.length) {
            const nextL = questionRawLines[nextQIdx];
            const nextTrimmed = nextL.trim();

            // Stop if next real question (starts with "- " but not indented sub-option)
            if (/^-\s+/.test(nextL) && !/^\s{2,}/.test(nextL)) break;
            // Stop at new markdown heading
            if (/^#{1,6}/.test(nextL)) break;

            optionLines.push(nextL);
            nextQIdx++;
          }

          // Combine all option text
          const combinedOptionText = [fullQText, ...optionLines].join(' ');

          let opts = { A: '', B: '', C: '', D: '' };

          // Try parsing inline "(A) ... (B) ... (C) ... (D) ..."
          if (/\(A\)/.test(combinedOptionText)) {
            opts = parseInlineOptions(combinedOptionText);
            // Extract question text (before first (A))
            const qOnly = combinedOptionText.split(/\(A\)/)[0].trim();
            fullQText = cleanLine(qOnly);
          } else {
            // Options are on separate bullet sub-lines
            // First line is question text
            const subBullets = optionLines
              .filter(l => l.trim().length > 0)
              .map(l => l.replace(/^\s*[-*]\s*/, '').trim());

            if (subBullets.length >= 2) {
              // Map: A = subBullets[0], B = subBullets[1], etc. or parse (B),(C),(D) markers
              const hasBCDMarkers = subBullets.some(l => /\([BCD]\)/.test(l));
              if (hasBCDMarkers) {
                opts = parseBulletOptions(subBullets);
              } else {
                // Assign sequentially
                const letters = ['A', 'B', 'C', 'D'];
                for (let k = 0; k < Math.min(subBullets.length, 4); k++) {
                  opts[letters[k]] = subBullets[k].replace(/^\([ABCD]\)\s*/, '').trim();
                }
              }
            }
            fullQText = cleanLine(fullQText);
          }

          // Filter out questions without meaningful options
          const hasOpts = opts.A && opts.B;
          if (!hasOpts) { i2 = nextQIdx; continue; }

          // Clean all option texts
          for (const k of ['A', 'B', 'C', 'D']) {
            opts[k] = cleanLine(opts[k]).replace(/^[-*\s]+/, '').trim();
          }

          globalQuestionNum++;
          const correctAnswer = answerArray[globalQuestionNum - 1] || 'A';

          questions.push({
            id: `${testId}_Q${globalQuestionNum}`,
            number: globalQuestionNum,
            text: fullQText,
            options: opts,
            correctAnswer,
          });

          i2 = nextQIdx;
        } else {
          i2++;
        }
      }

      if (questions.length > 0 && passageClean.length > 20) {
        questionGroups.push({
          id: `${testId}_G${questionGroups.length + 1}`,
          passageRange: groupHeader || '',
          passage: passageClean,
          questions,
        });
      }
    }

    const totalQuestions = questionGroups.reduce((s, g) => s + g.questions.length, 0);
    const timerMinutes = Math.round((totalQuestions / 50) * 55);

    tests.push({
      id: testId,
      title: meta.title,
      period: meta.period,
      num: meta.num,
      totalQuestions,
      timerMinutes: Math.max(timerMinutes, 20),
      questionGroups,
    });
  }

  return tests;
}

// ─── Generate Output ───────────────────────────────────────────────────────────
const tests = parse();

let totalQ = 0;
tests.forEach(t => {
  totalQ += t.totalQuestions;
  console.log(`${t.id}: ${t.questionGroups.length} groups, ${t.totalQuestions} questions`);
});
console.log(`\nTotal: ${totalQ} questions across ${tests.length} tests`);

const output = `// AUTO-GENERATED by scripts/parse-markdown.mjs — DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}
// Source: TOEFL-PBT-Practice-test.md

import type { PracticeTest } from '../types';

export const PRACTICE_TESTS: PracticeTest[] = ${JSON.stringify(tests, null, 2)};

export const getTestById = (id: string): PracticeTest | undefined =>
  PRACTICE_TESTS.find(t => t.id === id);
`;

writeFileSync(OUT_PATH, output, 'utf-8');
console.log(`\n✅ Written to ${OUT_PATH}`);
