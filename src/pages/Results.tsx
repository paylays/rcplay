import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById } from '../data/questions';
import { useProgressStore } from '../store/useProgress';
import { exportResultAsPNG } from '../utils/exportResult';
import ThemeToggle from '../components/ThemeToggle';
import type { AnswerLetter } from '../types';

// Map score percentage to TOEFL PBT scale (approximate)
function getToeflScore(pct: number): { score: number; level: string; color: string } {
  if (pct >= 90) return { score: 677, level: 'Sangat Baik', color: '#4A7C59' };
  if (pct >= 80) return { score: 600, level: 'Baik', color: '#4A7C59' };
  if (pct >= 70) return { score: 550, level: 'Cukup Baik', color: '#E8C547' };
  if (pct >= 60) return { score: 500, level: 'Cukup', color: '#E8C547' };
  if (pct >= 50) return { score: 450, level: 'Di Bawah Rata-rata', color: '#D97706' };
  return { score: 310, level: 'Perlu Banyak Latihan', color: '#C0392B' };
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

// Arc SVG component
function ScoreArc({ pct }: { pct: number }) {
  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r; // half-circle
  const strokeDashoffset = circumference * (1 - pct / 100);

  return (
    <svg viewBox="0 0 200 120" className="score-arc" role="img" aria-label={`Skor ${pct}%`}>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--border)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="score-arc__fill"
      />
      {/* Text */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        className="score-arc__pct"
        fill="var(--text-primary)"
      >
        {pct}%
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        className="score-arc__label"
        fill="var(--text-dim)"
      >
        Akurasi
      </text>
    </svg>
  );
}

export default function Results() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { progress, resetTestProgress } = useProgressStore();

  const test = testId ? getTestById(testId) : undefined;
  const prog = testId ? progress[testId] : undefined;

  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('all');

  if (!test || !prog) {
    return (
      <div className="results-error page-enter">
        <h2>Hasil tidak ditemukan</h2>
        <button onClick={() => navigate('/')}>← Beranda</button>
      </div>
    );
  }

  const pct = Math.round((prog.score / prog.total) * 100);
  const toefl = getToeflScore(pct);
  const wrongCount = prog.total - prog.score;
  const unanswered = prog.total - Object.keys(prog.answers).length;

  // Flatten questions for review
  const allQuestions = test.questionGroups.flatMap(g =>
    g.questions.map(q => ({ question: q }))
  );

  const handleRetry = () => {
    if (testId) {
      resetTestProgress(testId);
      navigate(`/quiz/${testId}`);
    }
  };

  return (
    <div className="results page-enter">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="results__header">
        <button className="results__back" onClick={() => navigate('/')} id="btn-results-home">
          ← Beranda
        </button>
        <div className="results__test-name">{test.title}</div>
        <div className="results__header-right">
          <ThemeToggle />
        </div>
      </header>

      {/* ── Score Section ─────────────────────────────────────────────────── */}
      <main className="results__main">
        <div className="results__top">
          {/* Left: Big score */}
          <div className="results__score-block">
            <div className="results__score-eyebrow">Hasil Akhir</div>
            <div className="results__score-big">
              <span className="results__score-num">{prog.score}</span>
              <span className="results__score-total">/{prog.total}</span>
            </div>
            <div className="results__score-sub">soal dijawab benar</div>

            <div className="results__toefl" style={{ '--level-color': toefl.color } as React.CSSProperties}>
              <span className="results__toefl-score">{toefl.score}</span>
              <div className="results__toefl-meta">
                <span className="results__toefl-label">Estimasi TOEFL</span>
                <span className="results__toefl-level">{toefl.level}</span>
              </div>
            </div>

            {prog.timeTaken > 0 && (
              <div className="results__time">
                Waktu: <strong>{formatTime(prog.timeTaken)}</strong>
              </div>
            )}
          </div>

          {/* Right: Arc + breakdown */}
          <div className="results__arc-block">
            <ScoreArc pct={pct} />

            <div className="results__breakdown">
              <div className="results__breakdown-item results__breakdown-item--correct">
                <span className="results__breakdown-num">{prog.score}</span>
                <span className="results__breakdown-label">Benar</span>
              </div>
              <div className="results__breakdown-sep" />
              <div className="results__breakdown-item results__breakdown-item--wrong">
                <span className="results__breakdown-num">{wrongCount}</span>
                <span className="results__breakdown-label">Salah</span>
              </div>
              <div className="results__breakdown-sep" />
              <div className="results__breakdown-item">
                <span className="results__breakdown-num">{unanswered}</span>
                <span className="results__breakdown-label">Kosong</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="results__actions">
          <button className="btn-action btn-action--primary" onClick={handleRetry} id="btn-retry">
            Ulangi Test
          </button>
          <button className="btn-action btn-action--secondary" onClick={() => navigate('/')} id="btn-pick-test">
            Pilih Test Lain
          </button>
          <button
            className="btn-action btn-action--export"
            onClick={() => exportResultAsPNG({ test, progress: prog })}
            id="btn-export"
          >
            ↓ Export PNG
          </button>
          <button
            className="btn-action btn-action--ghost"
            onClick={() => setShowReview(!showReview)}
            id="btn-toggle-review"
          >
            {showReview ? 'Sembunyikan Review' : 'Review Jawaban'}
          </button>
        </div>

        {/* ── Review Section ─────────────────────────────────────────────── */}
        {showReview && (
          <div className="review-section">
            <div className="review-section__header">
              <h2 className="review-section__title">Review Jawaban</h2>
              <div className="review-filter">
                <button
                  className={`review-filter__btn ${reviewFilter === 'all' ? 'review-filter__btn--active' : ''}`}
                  onClick={() => setReviewFilter('all')}
                  id="filter-all"
                >
                  Semua
                </button>
                <button
                  className={`review-filter__btn ${reviewFilter === 'wrong' ? 'review-filter__btn--active' : ''}`}
                  onClick={() => setReviewFilter('wrong')}
                  id="filter-wrong"
                >
                  Salah Saja
                </button>
              </div>
            </div>

            <div className="review-list">
              {allQuestions
                .filter(({ question }) => {
                  if (reviewFilter === 'wrong') {
                    return prog.answers[question.number] !== question.correctAnswer;
                  }
                  return true;
                })
                .map(({ question }) => {
                  const userAnswer = prog.answers[question.number] as AnswerLetter | undefined;
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <div
                      key={question.id}
                      className={`review-item ${isCorrect ? 'review-item--correct' : 'review-item--wrong'}`}
                    >
                      <div className="review-item__header">
                        <span className="review-item__num">Soal {question.number}</span>
                        <span className={`review-item__status ${isCorrect ? 'review-item__status--correct' : 'review-item__status--wrong'}`}>
                          {isCorrect ? '✓ Benar' : '✗ Salah'}
                        </span>
                      </div>

                      <p className="review-item__question">{question.text}</p>

                      <div className="review-item__answers">
                        {(['A', 'B', 'C', 'D'] as AnswerLetter[]).map(letter =>
                          question.options[letter] ? (
                            <div
                              key={letter}
                              className={`review-answer
                                ${letter === question.correctAnswer ? 'review-answer--correct' : ''}
                                ${letter === userAnswer && !isCorrect ? 'review-answer--wrong' : ''}
                              `}
                            >
                              <span className="review-answer__letter">{letter}</span>
                              <span className="review-answer__text">{question.options[letter]}</span>
                            </div>
                          ) : null
                        )}
                      </div>

                      {!isCorrect && (
                        <div className="review-item__explanation">
                          Jawaban kamu: <strong>{userAnswer || '–'}</strong> ·
                          Jawaban benar: <strong>{question.correctAnswer}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
