/**
 * exportResult.ts
 * Canvas-based PNG export for quiz results — no external dependencies.
 */

import type { PracticeTest } from '../types';
import type { TestProgress } from '../types';

interface ExportOptions {
  test: PracticeTest;
  progress: TestProgress;
}

function getToeflScore(pct: number): { score: number; level: string } {
  if (pct >= 90) return { score: 677, level: 'Sangat Baik' };
  if (pct >= 80) return { score: 600, level: 'Baik' };
  if (pct >= 70) return { score: 550, level: 'Cukup Baik' };
  if (pct >= 60) return { score: 500, level: 'Cukup' };
  if (pct >= 50) return { score: 450, level: 'Di Bawah Rata-rata' };
  return { score: 310, level: 'Perlu Banyak Latihan' };
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m} menit ${s} detik`;
}



export function exportResultAsPNG({ test, progress }: ExportOptions): void {
  const W = 900;
  const H = 1100;

  const canvas = document.createElement('canvas');
  canvas.width = W * 2;   // retina
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const BG       = '#0D0D0D';
  const SURFACE  = '#1C1C19';
  const AMBER    = '#E8C547';
  const GREEN    = '#4A7C59';
  const RED      = '#C0392B';
  const TEXT1    = '#F0EDE8';
  const TEXT2    = '#9A9690';
  const BORDER   = '#2A2A26';

  const pct = Math.round((progress.score / progress.total) * 100);
  const toefl = getToeflScore(pct);
  const wrongCount = progress.total - progress.score;

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent bar ───────────────────────────────────────────────────────────
  ctx.fillStyle = AMBER;
  ctx.fillRect(0, 0, W, 4);

  // ── Header block ────────────────────────────────────────────────────────────
  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, 4, W, 90);

  // Eyebrow
  ctx.font = '500 11px monospace';
  ctx.fillStyle = AMBER;
  ctx.letterSpacing = '0.15em';
  ctx.fillText('HASIL LATIHAN', 40, 36);

  // Test title
  ctx.font = 'bold 22px Georgia';
  ctx.fillStyle = TEXT1;
  ctx.fillText(test.title, 40, 66);

  // Date
  ctx.font = '11px monospace';
  ctx.fillStyle = TEXT2;
  ctx.textAlign = 'right';
  ctx.fillText(progress.lastAttempt, W - 40, 66);
  ctx.textAlign = 'left';

  // ── Score block ──────────────────────────────────────────────────────────────
  let y = 130;

  // Big score number
  ctx.font = '900 100px Georgia';
  ctx.fillStyle = TEXT1;
  ctx.fillText(`${progress.score}`, 40, y + 90);

  // /total
  ctx.font = '700 40px Georgia';
  ctx.fillStyle = BORDER;
  const scoreW = ctx.measureText(`${progress.score}`).width;
  ctx.fillText(`/${progress.total}`, 40 + scoreW + 8, y + 86);

  // Label
  ctx.font = '400 13px sans-serif';
  ctx.fillStyle = TEXT2;
  ctx.fillText('soal dijawab benar', 40, y + 115);

  // ── Percentage arc ───────────────────────────────────────────────────────────
  const arcX = W - 160;
  const arcY = y + 60;
  const arcR = 70;

  // Background arc
  ctx.beginPath();
  ctx.arc(arcX, arcY, arcR, Math.PI, 2 * Math.PI);
  ctx.lineWidth = 10;
  ctx.strokeStyle = BORDER;
  ctx.stroke();

  // Fill arc
  const fillEnd = Math.PI + (Math.PI * pct) / 100;
  ctx.beginPath();
  ctx.arc(arcX, arcY, arcR, Math.PI, fillEnd);
  ctx.strokeStyle = AMBER;
  ctx.stroke();

  // Pct text
  ctx.font = '700 32px monospace';
  ctx.fillStyle = TEXT1;
  ctx.textAlign = 'center';
  ctx.fillText(`${pct}%`, arcX, arcY + 8);

  ctx.font = '500 10px monospace';
  ctx.fillStyle = TEXT2;
  ctx.fillText('AKURASI', arcX, arcY + 26);
  ctx.textAlign = 'left';

  y += 160;

  // ── Separator ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(W - 40, y);
  ctx.stroke();

  y += 28;

  // ── TOEFL Estimate ──────────────────────────────────────────────────────────
  const toeflColor = pct >= 70 ? GREEN : pct >= 50 ? AMBER : RED;
  ctx.fillStyle = toeflColor + '22';  // 13% opacity
  ctx.fillRect(40, y, W - 80, 72);

  // Border left
  ctx.fillStyle = toeflColor;
  ctx.fillRect(40, y, 4, 72);

  ctx.font = '700 40px monospace';
  ctx.fillStyle = toeflColor;
  ctx.fillText(`${toefl.score}`, 60, y + 48);

  ctx.font = '500 10px monospace';
  ctx.fillStyle = TEXT2;
  ctx.fillText('ESTIMASI TOEFL PBT', 140, y + 26);

  ctx.font = '600 16px sans-serif';
  ctx.fillStyle = toeflColor;
  ctx.fillText(toefl.level, 140, y + 50);

  y += 100;

  // ── Breakdown row ────────────────────────────────────────────────────────────
  const colW = (W - 80) / 3;
  const stats = [
    { label: 'BENAR', val: `${progress.score}`, color: GREEN },
    { label: 'SALAH', val: `${wrongCount}`, color: RED },
    { label: 'WAKTU', val: formatTime(progress.timeTaken), color: AMBER },
  ];

  stats.forEach((s, i) => {
    const colX = 40 + i * colW;
    ctx.fillStyle = SURFACE;
    ctx.fillRect(colX, y, colW - 8, 70);

    ctx.font = '700 28px monospace';
    ctx.fillStyle = s.color;
    ctx.fillText(s.val, colX + 16, y + 42);

    ctx.font = '500 10px monospace';
    ctx.fillStyle = TEXT2;
    ctx.fillText(s.label, colX + 16, y + 60);
  });

  y += 90;

  // ── Per-question grid ────────────────────────────────────────────────────────
  ctx.font = '500 10px monospace';
  ctx.fillStyle = TEXT2;
  ctx.fillText('DETAIL PER SOAL', 40, y);
  y += 16;

  const allQuestions = test.questionGroups.flatMap(g => g.questions);
  const cols = 10;
  const cellSize = 34;
  const cellGap = 4;

  allQuestions.forEach((q, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const cx = 40 + col * (cellSize + cellGap);
    const cy = y + row * (cellSize + cellGap);

    const userAns = progress.answers[q.number];
    const correct = userAns === q.correctAnswer;
    const unanswered = !userAns;

    ctx.fillStyle = unanswered ? SURFACE : correct ? GREEN + '44' : RED + '44';
    ctx.fillRect(cx, cy, cellSize, cellSize);

    // Border
    ctx.strokeStyle = unanswered ? BORDER : correct ? GREEN : RED;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, cellSize, cellSize);

    // Number
    ctx.font = '500 9px monospace';
    ctx.fillStyle = TEXT2;
    ctx.textAlign = 'center';
    ctx.fillText(`${q.number}`, cx + cellSize / 2, cy + 13);

    // Answer letter
    ctx.font = '700 12px monospace';
    ctx.fillStyle = unanswered ? TEXT2 : correct ? GREEN : RED;
    ctx.fillText(userAns || '–', cx + cellSize / 2, cy + 28);

    ctx.textAlign = 'left';
  });

  const rows = Math.ceil(allQuestions.length / cols);
  y += rows * (cellSize + cellGap) + 24;

  // ── Footer ───────────────────────────────────────────────────────────────────
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(W - 40, y);
  ctx.stroke();

  y += 20;

  ctx.font = '500 11px monospace';
  ctx.fillStyle = TEXT2;
  ctx.fillText('TOEFL PBT Practice — Reading Comprehension', 40, y + 14);
  ctx.textAlign = 'right';
  ctx.fillStyle = AMBER + '88';
  ctx.fillText('RC', W - 40, y + 14);
  ctx.textAlign = 'left';

  // ── Download ─────────────────────────────────────────────────────────────────
  const filename = `TOEFL_${test.id}_${progress.lastAttempt}_${pct}pct.png`;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
