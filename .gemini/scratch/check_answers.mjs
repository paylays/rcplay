// Script to analyze WRONG correct answers in questions.ts vs answer key
import fs from 'fs';

const questionsContent = fs.readFileSync('src/data/questions.ts', 'utf-8');
const match = questionsContent.match(/export const PRACTICE_TESTS: PracticeTest\[\] = (\[[\s\S]*\]);/);
const tests = JSON.parse(match[1]);

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
const answerKeys = {};
const answerKeySection = txtContent.substring(txtContent.indexOf('ANSWER KEY'));
const lines = answerKeySection.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const ptMatch = line.match(/PRACTICE TEST (\d+)/);
  if (ptMatch && !line.includes('ANSWER KEY')) {
    const ptNum = parseInt(ptMatch[1]);
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

let totalWrong = 0;
for (const test of tests) {
  const ptNum = test.num;
  const expectedAnswers = answerKeys[ptNum];
  if (!expectedAnswers) continue;

  const allQuestions = [];
  for (const group of test.questionGroups) {
    for (const q of group.questions) {
      allQuestions.push(q);
    }
  }

  const wrongAnswers = [];
  for (const q of allQuestions) {
    const qIdx = q.number - 1;
    if (qIdx < expectedAnswers.length) {
      const expected = expectedAnswers[qIdx];
      if (q.correctAnswer !== expected) {
        wrongAnswers.push({
          id: q.id,
          number: q.number,
          text: q.text.substring(0, 80),
          current: q.correctAnswer,
          expected: expected
        });
      }
    }
  }

  if (wrongAnswers.length > 0) {
    console.log(`\nPT${ptNum}: ${wrongAnswers.length} wrong answers:`);
    for (const w of wrongAnswers) {
      console.log(`  Q${w.number} (${w.id}): "${w.current}" -> "${w.expected}"`);
    }
    totalWrong += wrongAnswers.length;
  }
}

console.log(`\nTotal wrong answers: ${totalWrong}`);
