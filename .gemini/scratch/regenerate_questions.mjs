/**
 * Comprehensive parser that reads TOEFL-PBT-Practice-test.txt,
 * extracts ALL questions, and regenerates questions.ts with missing
 * questions added.
 */
import fs from 'fs';

// ─── Read source files ───────────────────────────────────────────────
const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
const tsContent  = fs.readFileSync('src/data/questions.ts', 'utf-8');

// ─── Parse answer keys ──────────────────────────────────────────────
const answerKeys = {};
// Find the first occurrence of ANSWER KEY after the TOC (skip first 1000 chars)
const actualAkStart = txtContent.indexOf('ANSWER KEY', 1000);
const akSection = txtContent.substring(actualAkStart);
const akLines = akSection.split(/\r?\n/);

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

// ─── Parse existing questions.ts ────────────────────────────────────
const tsMatch = tsContent.match(
  /export const PRACTICE_TESTS: PracticeTest\[\] = (\[[\s\S]*?\]);\s*\n\s*export/
);
if (!tsMatch) {
  console.error('Could not find PRACTICE_TESTS array');
  process.exit(1);
}
const existingTests = JSON.parse(tsMatch[1]);

// ─── Parse questions from TXT file ──────────────────────────────────
// Split txt into practice test sections
function splitIntoPracticeTests(txt) {
  const sections = {};
  const answerKeyStart = txt.indexOf('ANSWER KEY', 1000);
  const mainContent = txt.substring(0, answerKeyStart);
  
  const ptPattern = /PRACTICE TEST (\d+)/g;
  let match;
  const starts = [];
  while ((match = ptPattern.exec(mainContent)) !== null) {
    const num = parseInt(match[1]);
    // Ignore the table of contents at the beginning which also has PRACTICE TEST (\d+)
    // The actual headers have a month/year or "Questions 1-..." shortly after them
    const snippet = mainContent.substring(match.index, match.index + 100);
    if (snippet.match(/PRACTICE TEST \d+\r?\n[a-zA-Z]+\s+\d{4}/) ||
        snippet.match(/PRACTICE TEST \d+\r?\n\r?\n?(Questions|Passage)/i) ||
        snippet.match(/PRACTICE TEST \d+\r?\n\r?\n[a-zA-Z]+/)) {
      starts.push({
        num: num,
        index: match.index
      });
    }
  }
  
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index;
    const end = i + 1 < starts.length ? starts[i + 1].index : answerKeyStart;
    sections[starts[i].num] = {
      content: mainContent.substring(start, end)
    };
  }
  
  return sections;
}

const ptSections = splitIntoPracticeTests(txtContent);

// ─── Parse questions from a practice test section ───────────────────
function parseQuestionsFromSection(sectionText, ptNum) {
  const lines = sectionText.split(/\r?\n/);
  const questions = []; // { number, text, options: {A, B, C, D} }
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Match question start: "N. question text"
    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      let qText = qMatch[2].trim();
      
      // Check if the question text has options on the same line
      // or if options start on next lines
      const options = { A: '', B: '', C: '', D: '' };
      let optionsFound = 0;
      
      // First check if options are inline with the question
      // Pattern: question text\n(A) ... (B) ... etc.
      // Or: question text (A) ... on same line
      
      // Check if the question line itself contains (A)
      const inlineOptMatch = qText.match(/^(.*?)\s*\(A\)\s+(.+)/);
      if (inlineOptMatch) {
        qText = inlineOptMatch[1].trim();
        // Parse inline options from this point
        const optStr = '(A) ' + inlineOptMatch[2];
        const parsed = parseOptionsFromString(optStr);
        if (parsed) {
          Object.assign(options, parsed);
          optionsFound = Object.values(parsed).filter(v => v).length;
        }
      }
      
      // Look at subsequent lines for options or continuation
      let j = i + 1;
      while (j < lines.length && optionsFound < 4) {
        const nextLine = lines[j].trim();
        if (!nextLine) { j++; continue; }
        
        // Check if this is a new question
        if (nextLine.match(/^\d+\.\s+/)) break;
        
        // Check if this is a passage start or section break
        if (nextLine.match(/^(Question|Questions|Passage)\s/i)) break;
        if (nextLine.match(/^PRACTICE TEST/)) break;
        if (nextLine.match(/^Line\t/)) break;
        if (nextLine.match(/^\(\d+\)\t/)) break;
        
        // Check if this line has options
        if (nextLine.match(/^\(?[A-D]\)?[\s.)]/)) {
          const parsed = parseOptionsFromString(nextLine);
          if (parsed) {
            for (const [key, val] of Object.entries(parsed)) {
              if (val && !options[key]) {
                options[key] = val;
                optionsFound++;
              }
            }
          }
          j++;
          continue;
        }
        
        // Could be continuation of question text (if no options found yet)
        if (optionsFound === 0 && !nextLine.startsWith('(')) {
          qText += ' ' + nextLine;
          j++;
          continue;
        }
        
        j++;
      }
      
      // Only add if we found at least some options
      if (optionsFound >= 2) {
        questions.push({
          number: qNum,
          text: cleanText(qText),
          options
        });
      }
      
      i = j;
      continue;
    }
    
    i++;
  }
  
  return questions;
}

function parseOptionsFromString(str) {
  const options = {};
  
  // Handle various option formats:
  // (A) text\t(B) text\t(C) text\t(D) text
  // (A) text  (B) text
  // (A) text
  
  // First try tab-separated
  const parts = str.split(/\t+/);
  
  for (const part of parts) {
    const trimmed = part.trim();
    const optMatch = trimmed.match(/^\(?([A-D])\)?\s+(.+)/);
    if (optMatch) {
      const letter = optMatch[1];
      let value = optMatch[2].trim();
      // Remove trailing period or whitespace
      value = value.replace(/\s*\d+\s*$/, '').trim(); // Remove trailing page numbers
      options[letter] = value;
    }
  }
  
  // If only one option found via tabs, try splitting by (B), (C), (D) patterns
  if (Object.keys(options).length <= 1) {
    const fullStr = str;
    const optRegex = /\(?([A-D])\)?\s+([^(]+?)(?=\s*\(?[B-D]\)|$)/g;
    let m;
    while ((m = optRegex.exec(fullStr)) !== null) {
      const letter = m[1];
      let value = m[2].trim();
      value = value.replace(/\s*\d+\s*$/, '').trim();
      if (value) options[letter] = value;
    }
  }
  
  return Object.keys(options).length > 0 ? options : null;
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*\?\s*$/, '')
    .trim();
}

// ─── Main processing ────────────────────────────────────────────────
console.log('=== Processing Practice Tests ===\n');

const updatedTests = JSON.parse(JSON.stringify(existingTests)); // deep clone

for (const test of updatedTests) {
  const ptNum = test.num;
  const ak = answerKeys[ptNum];
  const section = ptSections[ptNum];
  
  if (!ak) {
    console.log(`PT${ptNum}: No answer key found, skipping`);
    continue;
  }
  if (!section) {
    console.log(`PT${ptNum}: No txt section found, skipping`);
    continue;
  }
  
  // Parse all questions from the txt
  const txtQuestions = parseQuestionsFromSection(section.content, ptNum);
  
  console.log(`PT${ptNum}: Found ${txtQuestions.length} questions in txt, answer key has ${ak.length} answers`);
  
  // Build a map of existing questions by their text (first 40 chars normalized)
  const existingByText = new Map();
  let seqNum = 0;
  for (const group of test.questionGroups) {
    for (const q of group.questions) {
      const normText = q.text.substring(0, 40).toLowerCase().replace(/[^a-z0-9]/g, '');
      existingByText.set(normText, q);
      seqNum++;
    }
  }
  
  // For each question group, determine which original question numbers it covers
  // using passageRange
  for (const group of test.questionGroups) {
    const rangeMatch = group.passageRange.match(/(\d+)-(\d+)/);
    if (!rangeMatch) continue;
    
    const rangeStart = parseInt(rangeMatch[1]);
    const rangeEnd = parseInt(rangeMatch[2]);
    
    // Find all txt questions in this range
    const rangeQuestions = txtQuestions.filter(q => q.number >= rangeStart && q.number <= rangeEnd);
    
    if (rangeQuestions.length === 0) continue;
    
    // Check which are missing from the group
    const existingTexts = new Set();
    for (const q of group.questions) {
      const normText = q.text.substring(0, 40).toLowerCase().replace(/[^a-z0-9]/g, '');
      existingTexts.add(normText);
    }
    
    const missingQuestions = [];
    for (const tq of rangeQuestions) {
      const normText = tq.text.substring(0, 40).toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if this question exists
      let found = false;
      for (const eq of group.questions) {
        const eNorm = eq.text.substring(0, 40).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (eNorm === normText || 
            normText.includes(eNorm.substring(0, 25)) || 
            eNorm.includes(normText.substring(0, 25))) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        // This question is missing - add it
        const ansIdx = tq.number - 1;
        const correctAnswer = ansIdx < ak.length ? ak[ansIdx] : 'A';
        
        missingQuestions.push({
          originalNumber: tq.number,
          text: tq.text,
          options: tq.options,
          correctAnswer
        });
      }
    }
    
    if (missingQuestions.length > 0) {
      console.log(`  Group ${group.id} (${group.passageRange}): Adding ${missingQuestions.length} missing questions`);
      
      // Insert missing questions into the group
      // We need to interleave them in the correct position
      // Build a complete list ordered by original question number
      
      // Map existing questions to their original numbers
      const existingWithOriginal = [];
      for (const q of group.questions) {
        // Find the matching txt question to get the original number
        const normText = q.text.substring(0, 40).toLowerCase().replace(/[^a-z0-9]/g, '');
        let origNum = null;
        for (const tq of rangeQuestions) {
          const tNorm = tq.text.substring(0, 40).toLowerCase().replace(/[^a-z0-9]/g, '');
          if (tNorm === normText || 
              normText.includes(tNorm.substring(0, 25)) || 
              tNorm.includes(normText.substring(0, 25))) {
            origNum = tq.number;
            break;
          }
        }
        existingWithOriginal.push({ ...q, _origNum: origNum || q.number });
      }
      
      // Add missing questions
      for (const mq of missingQuestions) {
        existingWithOriginal.push({
          id: `${test.id}_Q${mq.originalNumber}`, // temporary, will be renumbered
          number: mq.originalNumber,
          text: mq.text,
          options: mq.options,
          correctAnswer: mq.correctAnswer,
          _origNum: mq.originalNumber
        });
      }
      
      // Sort by original number
      existingWithOriginal.sort((a, b) => a._origNum - b._origNum);
      
      // Remove temp field
      group.questions = existingWithOriginal.map(q => {
        const { _origNum, ...rest } = q;
        return rest;
      });
    }
  }
  
  // Now re-number all questions sequentially
  let seq = 1;
  for (const group of test.questionGroups) {
    for (const q of group.questions) {
      q.id = `${test.id}_Q${seq}`;
      q.number = seq;
      seq++;
    }
  }
  
  // Update totalQuestions
  const totalQ = seq - 1;
  const oldTotal = test.totalQuestions;
  test.totalQuestions = totalQ;
  
  // Update timerMinutes based on total questions (approximately 50 seconds per question)
  // Actually, keep the original timer or calculate based on standard TOEFL timing
  // Standard TOEFL Reading: 55 minutes for 50 questions ≈ ~1.1 min per question
  // But we'll just update based on the ratio
  if (totalQ !== oldTotal) {
    test.timerMinutes = Math.round(totalQ * (55 / 50));
  }
  
  console.log(`  Total questions: ${oldTotal} -> ${totalQ}`);
}

// ─── Generate output ────────────────────────────────────────────────
function escapeForJson(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Use JSON.stringify with formatting
const jsonStr = JSON.stringify(updatedTests, null, 2);

const output = `// AUTO-GENERATED by scripts/parse-markdown.mjs — DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}
// Source: TOEFL-PBT-Practice-test.md

import type { PracticeTest } from '../types';

export const PRACTICE_TESTS: PracticeTest[] = ${jsonStr};

export const getTestById = (id: string): PracticeTest | undefined =>
  PRACTICE_TESTS.find(t => t.id === id);
`;

fs.writeFileSync('src/data/questions.ts', output, 'utf-8');
console.log('\n=== Done! Written updated questions.ts ===');

// ─── Verification ───────────────────────────────────────────────────
console.log('\n=== Verification ===');
const newContent = fs.readFileSync('src/data/questions.ts', 'utf-8');
const newMatch = newContent.match(/export const PRACTICE_TESTS: PracticeTest\[\] = (\[[\s\S]*?\]);\s*\n\s*export/);
const newTests = JSON.parse(newMatch[1]);

let totalMismatches = 0;
for (const test of newTests) {
  const ak = answerKeys[test.num];
  if (!ak) continue;
  
  const allQ = [];
  for (const g of test.questionGroups) {
    for (const q of g.questions) allQ.push(q);
  }
  
  let mismatches = 0;
  for (const q of allQ) {
    const idx = q.number - 1;
    if (idx < ak.length && q.correctAnswer !== ak[idx]) {
      console.log(`  PT${test.num} Q${q.number}: expected ${ak[idx]}, got ${q.correctAnswer}`);
      mismatches++;
    }
  }
  
  const expected = ak.length;
  const got = allQ.length;
  if (got !== expected) {
    console.log(`  PT${test.num}: count mismatch - got ${got}, expected ${expected} (still missing ${expected - got})`);
  }
  totalMismatches += mismatches;
}

console.log(`Total answer mismatches: ${totalMismatches}`);
