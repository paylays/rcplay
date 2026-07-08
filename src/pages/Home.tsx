import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRACTICE_TESTS } from '../data/questions';
import { useProgressStore } from '../store/useProgress';
import { useAccessStore, isTestUnlocked } from '../store/useAccess';
import ThemeToggle from '../components/ThemeToggle';
import LockedModal from '../components/LockedModal';

export default function Home() {
  const navigate = useNavigate();
  const { progress } = useProgressStore();
  const { level, resetAccess } = useAccessStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTestTitle, setSelectedTestTitle] = useState('');

  const totalDone = Object.keys(progress).length;
  const totalScore = Object.values(progress).reduce((s, p) => s + p.score, 0);
  const totalAnswered = Object.values(progress).reduce((s, p) => s + p.total, 0);
  const avgPct = totalAnswered > 0 ? Math.round((totalScore / totalAnswered) * 100) : null;

  const handleTestClick = (testId: string, testTitle: string) => {
    if (isTestUnlocked(testId, level)) {
      navigate(`/quiz/${testId}`);
    } else {
      setSelectedTestTitle(testTitle);
      setModalOpen(true);
    }
  };

  const handleDonate = () => {
    window.open('https://teer.id/paylays', '_blank');
    setModalOpen(false);
    navigate('/gate');
  };

  return (
    <div className="home page-enter">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="home__header">
        <div className="home__header-inner">
          <div className="home__title-block">
            <span className="home__eyebrow">Persiapan Ujian</span>
            <h1 className="home__title">
              RC<span className="home__title-accent">Play</span>
            </h1>
            <div className="home__title-line" />
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`access-badge access-badge--${level}`}>
                {level === 'full' ? 'Akses Penuh' : 'Akses Gratis (3 Test)'}
              </span>
              {level === 'free' && (
                <button
                  className="results-table__btn results-table__btn--start"
                  onClick={() => navigate('/gate')}
                  style={{ fontSize: '9px', padding: '2px 8px' }}
                >
                  Dukung Pengembang
                </button>
              )}
              {/* Reset Access (hidden/mini dev button) */}
              <button
                onClick={resetAccess}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '9px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 8px',
                }}
                title="Reset status donasi untuk testing"
              >
                Reset Status
              </button>
            </div>
          </div>
          <div className="home__meta-block">
            <div className="home__meta-top">
              <p className="home__subtitle">
                17 Practice Test · Reading Comprehension
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ThemeToggle />
                <button
                  className="home__dashboard-btn"
                  onClick={() => navigate('/dashboard')}
                  id="btn-go-dashboard"
                >
                  📊 Statistik
                </button>
              </div>
            </div>
            <p className="home__desc">
              Latihan soal pilihan ganda dari ujian TOEFL Paper-Based Test
              autentik. Pilih satu test, kerjakan dalam batas waktu, dan
              lihat hasilmu secara instan.
            </p>
            {avgPct !== null && (
              <div className="home__stats">
                <div className="home__stat">
                  <span className="home__stat-num">{totalDone}</span>
                  <span className="home__stat-label">test dikerjakan</span>
                </div>
                <div className="home__stat-divider" />
                <div className="home__stat">
                  <span className="home__stat-num">{avgPct}%</span>
                  <span className="home__stat-label">rata-rata skor</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="home__header-ornament" aria-hidden>
          <span>RC</span>
        </div>
      </header>

      {/* ── Test Grid ─────────────────────────────────────────────────────── */}
      <main className="home__main">
        <div className="home__section-label">
          <span>Pilih Practice Test</span>
          <div className="home__section-rule" />
        </div>

        <div className="home__grid">
          {PRACTICE_TESTS.map((test, idx) => {
            const prog = progress[test.id];
            const pct = prog ? Math.round((prog.score / prog.total) * 100) : null;
            const isFeatured = idx === 0;
            const unlocked = isTestUnlocked(test.id, level);

            return (
              <article
                key={test.id}
                className={`test-card ${isFeatured ? 'test-card--featured' : ''} ${prog ? 'test-card--done' : ''} ${!unlocked ? 'test-card--locked' : ''}`}
                onClick={() => handleTestClick(test.id, test.title)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleTestClick(test.id, test.title)}
                id={`test-card-${test.id}`}
              >
                <div className="test-card__number">
                  {String(test.num).padStart(2, '0')}
                </div>

                <div className="test-card__body">
                  <div className="test-card__title">{test.title}</div>
                  {test.period && (
                    <div className="test-card__period">{test.period}</div>
                  )}
                </div>

                <div className="test-card__footer">
                  <div className="test-card__info">
                    <span className="test-card__questions">
                      {test.totalQuestions} soal
                    </span>
                    <span className="test-card__dot">·</span>
                    <span className="test-card__timer">
                      {test.timerMinutes} menit
                    </span>
                  </div>

                  {prog ? (
                    <div className="test-card__badge test-card__badge--done">
                      <span className="test-card__score">{pct}%</span>
                      <span className="test-card__score-label">Selesai</span>
                    </div>
                  ) : (
                    <div className="test-card__badge test-card__badge--new">
                      {unlocked ? 'Mulai →' : '🔒 Premium'}
                    </div>
                  )}
                </div>

                {prog && (
                  <div
                    className="test-card__progress-bar"
                    style={{ '--pct': `${pct}%` } as React.CSSProperties}
                  />
                )}

                {!unlocked && (
                  <div className="test-card__lock-overlay">
                    <span className="test-card__lock-icon">🔒</span>
                    <span className="test-card__lock-label">Premium</span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="home__footer">
        <span>Sumber: TOEFL PBT Practice Tests 30–46</span>
        <span className="home__footer-dot">·</span>
        <span>Reading Comprehension</span>
        <span className="home__footer-dot">·</span>
        <span>
          Products by <a href="https://github.com/paylays" target="_blank" rel="noopener noreferrer">paylays</a>
        </span>
      </footer>

      {/* Locked Modal overlay */}
      <LockedModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onDonate={handleDonate}
        testTitle={selectedTestTitle}
      />
    </div>
  );
}
