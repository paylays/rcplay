import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');

function findAndPrint(qStr, numLines = 10) {
  console.log(`=== Matches for: ${qStr} ===`);
  const lines = txtContent.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(qStr)) {
      console.log(`Line ${i+1}:`);
      for (let j = Math.max(0, i - 1); j < Math.min(lines.length, i + numLines); j++) {
        console.log(`  ${j+1}: ${lines[j]}`);
      }
    }
  }
}

findAndPrint('27. Where in the passage does the author mention the ability of animals to recognized');
findAndPrint('2. When were women first allowed to enroll');
findAndPrint('4. Which of the following courses is most likely to have been offered');
findAndPrint('6. The author uses the expression "rocked by" in lines 16 - 17');
