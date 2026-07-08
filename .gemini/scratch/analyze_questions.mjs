// Script to analyze differences between questions.ts and TOEFL-PBT-Practice-test.txt
import fs from 'fs';

// Read the questions.ts file
const questionsContent = fs.readFileSync('src/data/questions.ts', 'utf-8');

// Parse the practice tests from questions.ts
// Extract the JSON array from the TypeScript
const match = questionsContent.match(/export const PRACTICE_TESTS: PracticeTest\[\] = (\[[\s\S]*\]);/);
if (!match) {
  console.log("Could not find PRACTICE_TESTS array");
  process.exit(1);
}

// Use eval-like approach - Function constructor
const jsonStr = match[1];
let tests;
try {
  tests = JSON.parse(jsonStr);
} catch(e) {
  console.log("Failed to parse JSON:", e.message);
  process.exit(1);
}

// Read the answer key from TOEFL-PBT-Practice-test.txt
const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');

// Parse answer keys
const answerKeys = {};
const answerKeySection = txtContent.substring(txtContent.indexOf('ANSWER KEY'));
const lines = answerKeySection.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const ptMatch = line.match(/PRACTICE TEST (\d+)/);
  if (ptMatch && !line.includes('ANSWER KEY')) {
    const ptNum = parseInt(ptMatch[1]);
    // Next non-empty line has the answers
    for (let j = i + 1; j < lines.length; j++) {
      const ansLine = lines[j].trim();
      if (ansLine && !ansLine.startsWith('PRACTICE TEST') && !ansLine.startsWith('ANSWER KEY')) {
        const answers = ansLine.replace(/\s+/g, '').split('');
        answerKeys[ptNum] = answers;
        break;
      }
    }
  }
}

// Now analyze each test
console.log("=== ANALYSIS OF QUESTIONS.TS ===\n");

for (const test of tests) {
  const ptNum = test.num;
  const expectedAnswers = answerKeys[ptNum];
  
  if (!expectedAnswers) {
    console.log(`PT${ptNum}: No answer key found in txt file`);
    continue;
  }
  
  // Collect all questions from the test
  const allQuestions = [];
  for (const group of test.questionGroups) {
    for (const q of group.questions) {
      allQuestions.push(q);
    }
  }
  
  const totalInFile = allQuestions.length;
  const totalExpected = expectedAnswers.length;
  
  if (totalInFile !== totalExpected) {
    console.log(`\n*** PT${ptNum} (${test.title}): Has ${totalInFile} questions, expected ${totalExpected} (missing ${totalExpected - totalInFile})`);
  }
  
  // Check for wrong correct answers
  const wrongAnswers = [];
  for (let i = 0; i < allQuestions.length; i++) {
    const q = allQuestions[i];
    const qIdx = q.number - 1; // 0-indexed
    if (qIdx < expectedAnswers.length) {
      const expected = expectedAnswers[qIdx];
      if (q.correctAnswer !== expected) {
        wrongAnswers.push({
          id: q.id,
          number: q.number,
          text: q.text.substring(0, 60),
          current: q.correctAnswer,
          expected: expected
        });
      }
    }
  }
  
  if (wrongAnswers.length > 0) {
    console.log(`\n*** PT${ptNum}: ${wrongAnswers.length} WRONG CORRECT ANSWERS:`);
    for (const w of wrongAnswers) {
      console.log(`  Q${w.number} (${w.id}): has "${w.current}", should be "${w.expected}" - "${w.text}..."`);
    }
  }
  
  // Check which question numbers are missing
  const presentNumbers = new Set(allQuestions.map(q => q.number));
  const missingNumbers = [];
  for (let i = 1; i <= totalExpected; i++) {
    if (!presentNumbers.has(i)) {
      missingNumbers.push(i);
    }
  }
  
  if (missingNumbers.length > 0) {
    console.log(`  Missing question numbers: ${missingNumbers.join(', ')}`);
  }
}

console.log("\n=== DONE ===");
