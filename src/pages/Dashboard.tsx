import { useNavigate } from 'react-router-dom';
import { PRACTICE_TESTS } from '../data/questions';
import { useProgressStore } from '../store/useProgress';
import ThemeToggle from '../components/ThemeToggle';

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

function getScoreColor(pct: number): string {
  if (pct >= 80) return 'var(--success)';
  if (pct >= 60) return 'var(--amber)';
  return 'var(--error)';
}

// Access-aware colors (gray for locked test statistics)
function getBarColor(pct: number, unlocked: boolean): string {
  if (!unlocked) return 'var(--text-dim)';
  return getScoreColor(pct);
}

function getScoreLevel(pct: number): string {
  if (pct >= 90) return 'Sangat Baik';
  if (pct >= 80) return 'Baik';
  if (pct >= 70) return 'Cukup Baik';
  if (pct >= 60) return 'Cukup';
  if (pct >= 50) return 'Di Bawah Rata-rata';
  return 'Perlu Latihan';
}

function getToeflEstimate(pct: number): number {
  if (pct >= 90) return 677;
  if (pct >= 80) return 600;
  if (pct >= 70) return 550;
  if (pct >= 60) return 500;
  if (pct >= 50) return 450;
  return 310;
}

// SVG Bar Chart — pure, no library
function BarChart({ data }: { data: { id: string; label: string; pct: number; score: number; total: number; unlocked: boolean }[] }) {
  const chartH = 180;
  const barW = Math.max(24, Math.min(48, Math.floor(760 / data.length) - 8));
  const gap = Math.max(6, Math.floor(760 / data.length) - barW);

  return (
    <div className="bar-chart" role="img" aria-label="Grafik skor per test">
      <svg
        viewBox={`0 0 ${data.length * (barW + gap)} ${chartH + 40}`}
        preserveAspectRatio="none"
        className="bar-chart__svg"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <line
            key={v}
            x1={0}
            y1={chartH - (v / 100) * chartH}
            x2={data.length * (barW + gap)}
            y2={chartH - (v / 100) * chartH}
            stroke="var(--border)"
            strokeWidth={v === 0 ? 1.5 : 0.5}
            strokeDasharray={v === 0 ? '' : '4,4'}
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.pct / 100) * chartH;
          const x = i * (barW + gap);
          const y = chartH - barH;
          const color = getBarColor(d.pct, d.unlocked);

          return (
            <g key={d.id} className="bar-chart__group">
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={color}
                fillOpacity={0.3}
                className="bar-chart__bar"
              />
              {/* Bar top fill */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={3}
                fill={color}
              />
              {/* Pct label */}
              {d.pct > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill={color}
                  fontFamily="monospace"
                  fontWeight={500}
                >
                  {d.pct}%
                </text>
              )}
              {/* X label */}
              <text
                x={x + barW / 2}
                y={chartH + 16}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-dim)"
                fontFamily="monospace"
              >
                {d.label.replace('Practice Test ', 'PT')}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Y-axis labels */}
      <div className="bar-chart__ylabels">
        {[100, 75, 50, 25, 0].map(v => (
          <span key={v}>{v}%</span>
        ))}
      </div>
    </div>
  );
}

import { useAccessStore, isTestUnlocked } from '../store/useAccess';

export default function Dashboard() {
  const navigate = useNavigate();
  const { progress } = useProgressStore();
  const { level } = useAccessStore();

  const completed = PRACTICE_TESTS.filter(t => progress[t.id]);
  const totalTests = completed.length;

  if (totalTests === 0) {
    return (
      <div className="dashboard page-enter">
        <header className="dashboard__header">
          <button className="dashboard__back" onClick={() => navigate('/')} id="btn-dashboard-home">
            ← Beranda
          </button>
          <h1 className="dashboard__title">Statistik</h1>
          <div className="dashboard__header-right">
            <ThemeToggle />
          </div>
        </header>
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon">📊</div>
          <h2>Belum Ada Data</h2>
          <p>Selesaikan minimal satu practice test untuk melihat statistik kamu.</p>
          <button className="dashboard__empty-cta" onClick={() => navigate('/')}>
            Mulai Latihan →
          </button>
        </div>
      </div>
    );
  }

  // Aggregate stats
  const totalScore = completed.reduce((s, t) => s + progress[t.id].score, 0);
  const totalAnswered = completed.reduce((s, t) => s + progress[t.id].total, 0);
  const totalTime = completed.reduce((s, t) => s + (progress[t.id].timeTaken || 0), 0);
  const avgPct = Math.round((totalScore / totalAnswered) * 100);
  const avgToefl = getToeflEstimate(avgPct);

  const bestTest = completed.reduce((best, t) => {
    const pct = Math.round((progress[t.id].score / progress[t.id].total) * 100);
    const bestPct = Math.round((progress[best.id].score / progress[best.id].total) * 100);
    return pct > bestPct ? t : best;
  });
  const worstTest = completed.reduce((worst, t) => {
    const pct = Math.round((progress[t.id].score / progress[t.id].total) * 100);
    const worstPct = Math.round((progress[worst.id].score / progress[worst.id].total) * 100);
    return pct < worstPct ? t : worst;
  });

  // Bar chart data — all 17 tests (gray out if locked)
  const chartData = PRACTICE_TESTS.map(t => {
    const p = progress[t.id];
    const unlocked = isTestUnlocked(t.id, level);
    return {
      id: t.id,
      label: t.title,
      pct: p ? Math.round((p.score / p.total) * 100) : 0,
      score: p?.score || 0,
      total: p?.total || t.totalQuestions,
      unlocked,
    };
  });

  return (
    <div className="dashboard page-enter">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="dashboard__header">
        <button className="dashboard__back" onClick={() => navigate('/')} id="btn-dashboard-home">
          ← Beranda
        </button>
        <h1 className="dashboard__title">Statistik</h1>
        <div className="dashboard__header-right">
          <ThemeToggle />
          <div className="dashboard__subtitle">{totalTests} dari 17 test diselesaikan</div>
        </div>
      </header>

      <main className="dashboard__main">
        {/* ── Overview KPIs ──────────────────────────────────────────────── */}
        <section className="dashboard__kpis">
          <div className="kpi-card kpi-card--featured">
            <span className="kpi-card__eyebrow">Rata-rata Akurasi</span>
            <div className="kpi-card__value" style={{ color: getScoreColor(avgPct) }}>
              {avgPct}<span className="kpi-card__unit">%</span>
            </div>
            <div className="kpi-card__sub">{getScoreLevel(avgPct)}</div>
          </div>

          <div className="kpi-card">
            <span className="kpi-card__eyebrow">Est. TOEFL</span>
            <div className="kpi-card__value" style={{ color: getScoreColor(avgPct) }}>
              {avgToefl}
            </div>
            <div className="kpi-card__sub">dari 677</div>
          </div>

          <div className="kpi-card">
            <span className="kpi-card__eyebrow">Test Selesai</span>
            <div className="kpi-card__value">{totalTests}</div>
            <div className="kpi-card__sub">dari 17 tersedia</div>
          </div>

          <div className="kpi-card">
            <span className="kpi-card__eyebrow">Total Soal</span>
            <div className="kpi-card__value">{totalScore}</div>
            <div className="kpi-card__sub">benar dari {totalAnswered}</div>
          </div>

          <div className="kpi-card">
            <span className="kpi-card__eyebrow">Total Waktu</span>
            <div className="kpi-card__value">{formatTime(totalTime)}</div>
            <div className="kpi-card__sub">waktu latihan</div>
          </div>
        </section>

        {/* ── Highlights ─────────────────────────────────────────────────── */}
        <section className="dashboard__highlights">
          <div className="highlight-card highlight-card--best">
            <span className="highlight-card__label">Test Terbaik</span>
            <span className="highlight-card__test">{bestTest.title}</span>
            <span className="highlight-card__score">
              {Math.round((progress[bestTest.id].score / progress[bestTest.id].total) * 100)}%
            </span>
          </div>
          <div className="highlight-card highlight-card--worst">
            <span className="highlight-card__label">Perlu Perbaikan</span>
            <span className="highlight-card__test">{worstTest.title}</span>
            <span className="highlight-card__score">
              {Math.round((progress[worstTest.id].score / progress[worstTest.id].total) * 100)}%
            </span>
          </div>
        </section>

        {/* ── Bar Chart ──────────────────────────────────────────────────── */}
        <section className="dashboard__chart-section">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">Grafik Skor per Test</h2>
            <div className="chart-legend">
              <span className="chart-legend__item chart-legend__item--good">≥80% Baik</span>
              <span className="chart-legend__item chart-legend__item--mid">60–79% Cukup</span>
              <span className="chart-legend__item chart-legend__item--low">&lt;60% Kurang</span>
            </div>
          </div>
          <div className="dashboard__chart">
            <BarChart data={chartData} />
          </div>
        </section>

        {/* ── Per-Test Table ─────────────────────────────────────────────── */}
        <section className="dashboard__table-section">
          <div className="dashboard__section-header">
            <h2 className="dashboard__section-title">Riwayat per Test</h2>
          </div>
          <div className="dashboard__table-wrap">
            <table className="results-table" id="results-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Skor</th>
                  <th>Akurasi</th>
                  <th>TOEFL Est.</th>
                  <th>Waktu</th>
                  <th>Tanggal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {PRACTICE_TESTS.map(test => {
                  const p = progress[test.id];
                  const unlocked = isTestUnlocked(test.id, level);

                  if (!p) {
                    return (
                      <tr key={test.id} className="results-table__row results-table__row--empty">
                        <td className="results-table__test-name">
                          <span className="results-table__num">{test.num}</span>
                          {test.title}
                          {!unlocked && <span style={{ fontSize: '10px', opacity: 0.6 }}>🔒</span>}
                        </td>
                        <td colSpan={5}>
                          <span className="results-table__not-done">Belum dikerjakan</span>
                        </td>
                        <td>
                          {unlocked ? (
                            <button
                              className="results-table__btn results-table__btn--start"
                              onClick={() => navigate(`/quiz/${test.id}`)}
                            >
                              Mulai →
                            </button>
                          ) : (
                            <button
                              className="results-table__btn"
                              onClick={() => navigate('/gate')}
                              style={{ color: 'var(--amber)', borderColor: 'var(--amber-dim)' }}
                            >
                              Premium 🔒
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  const pct = Math.round((p.score / p.total) * 100);
                  const color = getScoreColor(pct);

                  return (
                    <tr key={test.id} className="results-table__row">
                      <td className="results-table__test-name">
                        <span className="results-table__num">{test.num}</span>
                        {test.title}
                      </td>
                      <td>
                        <span className="results-table__score">
                          {p.score}<span className="results-table__total">/{p.total}</span>
                        </span>
                      </td>
                      <td>
                        <div className="results-table__pct-wrap">
                          <span className="results-table__pct" style={{ color }}>
                            {pct}%
                          </span>
                          <div className="results-table__mini-bar">
                            <div
                              className="results-table__mini-bar-fill"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="results-table__toefl" style={{ color }}>
                          {getToeflEstimate(pct)}
                        </span>
                      </td>
                      <td className="results-table__time">
                        {formatTime(p.timeTaken || 0)}
                      </td>
                      <td className="results-table__date">
                        {p.lastAttempt}
                      </td>
                      <td>
                        <button
                          className="results-table__btn"
                          onClick={() => navigate(`/results/${test.id}`)}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
