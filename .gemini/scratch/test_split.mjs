import fs from 'fs';
const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');
const answerKeyStart = txtContent.indexOf('ANSWER KEY');
const mainContent = txtContent.substring(0, answerKeyStart);
const parts = mainContent.split(/^PRACTICE TEST (\d+)\r?\n/gm);
console.log("Parts length:", parts.length);
if (parts.length > 1) {
  console.log("First match:", parts[1]);
  console.log("Second match:", parts[3]);
} else {
  console.log("No matches found!");
  // Let's see what happens without ^
  const parts2 = mainContent.split(/PRACTICE TEST (\d+)\r?\n/);
  console.log("Without ^ :", parts2.length);
}
