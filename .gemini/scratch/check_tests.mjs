import fs from 'fs';

const content = fs.readFileSync('./src/data/questions.ts', 'utf-8');
const match = content.match(/export const PRACTICE_TESTS: PracticeTest\[\] = (\[[\s\S]*\]);/);
if (match) {
  // Replace references/types to make it valid JSON
  let jsonText = match[1];
  const tests = eval(jsonText);
  console.log("Found tests:", tests.map(t => ({ id: t.id, totalQuestions: t.totalQuestions, numGroups: t.questionGroups.length })));
} else {
  console.log("Could not parse PRACTICE_TESTS");
}
