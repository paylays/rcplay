// Deeper analysis: match question text between questions.ts and txt to find the original numbering
import fs from 'fs';

const questionsContent = fs.readFileSync('src/data/questions.ts', 'utf-8');
const match = questionsContent.match(/export const PRACTICE_TESTS: PracticeTest\[\] = (\[[\s\S]*\]);/);
const tests = JSON.parse(match[1]);

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');

// Parse answer keys
const answerKeys = {};
const answerKeySection = txtContent.substring(txtContent.indexOf('ANSWER KEY'));
const alines = answerKeySection.split('\n');
for (let i = 0; i < alines.length; i++) {
  const line = alines[i].trim();
  const ptMatch = line.match(/PRACTICE TEST (\d+)/);
  if (ptMatch && !line.includes('ANSWER KEY')) {
    const ptNum = parseInt(ptMatch[1]);
    for (let j = i + 1; j < alines.length; j++) {
      const ansLine = alines[j].trim();
      if (ansLine && !ansLine.startsWith('PRACTICE TEST') && !ansLine.startsWith('ANSWER KEY')) {
        const answers = ansLine.replace(/\s+/g, '').split('');
        answerKeys[ptNum] = answers;
        break;
      }
    }
  }
}

// For PT30, check which txt question numbers are actually included
// by matching question texts
const test30 = tests.find(t => t.num === 30);
const ak30 = answerKeys[30];
// PT30 answer key has 50 answers

// Parse questions from txt for PT30
// Find the PT30 section
const pt30Start = txtContent.indexOf('PRACTICE TEST 30\r\nOctober 1997');
const pt30End = txtContent.indexOf('PRACTICE TEST 31');
const pt30Text = txtContent.substring(pt30Start, pt30End);

// Extract question numbers and their first few words
const qPattern = /^(\d+)\.\s+(.+)/gm;
let m;
const txtQuestions = {};
while ((m = qPattern.exec(pt30Text)) !== null) {
  const num = parseInt(m[1]);
  const text = m[2].trim().substring(0, 60);
  txtQuestions[num] = text;
}

console.log("=== PT30 Questions in TXT file ===");
for (const [num, text] of Object.entries(txtQuestions)) {
  console.log(`  Q${num}: ${text}`);
}

console.log("\n=== PT30 Questions in questions.ts ===");
const allQ30 = [];
for (const g of test30.questionGroups) {
  for (const q of g.questions) {
    allQ30.push(q);
  }
}

for (const q of allQ30) {
  const shortText = q.text.substring(0, 60);
  // Try to find matching question in txt
  let matchedTxtNum = null;
  for (const [num, text] of Object.entries(txtQuestions)) {
    // Simple similarity check
    if (shortText.includes(text.substring(0, 30)) || text.includes(shortText.substring(0, 30))) {
      matchedTxtNum = num;
      break;
    }
  }
  console.log(`  Q${q.number} (${q.id}): "${shortText}" -> TXT Q${matchedTxtNum || '???'}, correctAnswer=${q.correctAnswer}`);
}

// Now check: what are the total questions expected
console.log(`\nAnswer key has ${ak30.length} answers`);
console.log(`questions.ts has ${allQ30.length} questions`);
console.log(`TXT file has ${Object.keys(txtQuestions).length} questions parsed`);

// Check if the questions are numbered 1-N in questions.ts matching original txt numbers
for (const q of allQ30) {
  const idx = q.number - 1;
  if (idx < ak30.length) {
    console.log(`  Q${q.number}: correctAnswer=${q.correctAnswer}, answerKey[${idx}]=${ak30[idx]}, match=${q.correctAnswer === ak30[idx]}`);
  }
}
