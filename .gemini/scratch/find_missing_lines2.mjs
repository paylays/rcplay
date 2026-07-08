import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');

function printLinesAround(query, numBefore = 2, numAfter = 10) {
  console.log(`\n=== Lines around: "${query}" ===`);
  const lines = txtContent.split(/\r?\n/);
  // Find lines starting from index 1000 to avoid TOC
  let foundCount = 0;
  for (let i = 200; i < lines.length; i++) {
    if (lines[i].includes(query)) {
      foundCount++;
      console.log(`Match ${foundCount} (Line ${i + 1}):`);
      for (let j = Math.max(0, i - numBefore); j < Math.min(lines.length, i + numAfter); j++) {
        console.log(`  ${j + 1}: ${lines[j]}`);
      }
    }
  }
}

printLinesAround('PT42_Q27');
printLinesAround('PT45_Q2');
printLinesAround('PT45_Q4');
printLinesAround('PT46_Q6');

// Or look by text
printLinesAround('27. Where in the passage does the author mention the ability of animals to recognized');
printLinesAround('2. When were women first allowed to enroll');
printLinesAround('4. Which of the following courses is most likely to have been offered');
printLinesAround('6. The author uses the expression "rocked by" in lines 16 - 17');
printLinesAround('6. Where in the passage is Winslow Homer\'s previous occupation mentioned?');
