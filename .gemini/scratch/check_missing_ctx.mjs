import fs from 'fs';

const txtContent = fs.readFileSync('TOEFL-PBT-Practice-test.txt', 'utf-8');

function showContext(query, before = 1, after = 3) {
  const idx = txtContent.indexOf(query);
  if (idx !== -1) {
    console.log(`=== Context for "${query}" ===`);
    const start = Math.max(0, txtContent.lastIndexOf('\n', idx) - 100);
    const end = Math.min(txtContent.length, txtContent.indexOf('\n', idx) + 300);
    console.log(txtContent.substring(start, end));
  } else {
    console.log(`Query "${query}" not found`);
  }
}

showContext('PRACTICE TEST 42\r\nDecember 1995');
showContext('PRACTICE TEST 45\r\nAugust 1994');
showContext('PRACTICE TEST 46\r\nOctober 1994');
