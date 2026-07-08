import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById } from '../data/questions';
import { useProgressStore } from '../store/useProgress';
import { useAccessStore, isTestUnlocked } from '../store/useAccess';
import ThemeToggle from '../components/ThemeToggle';
import type { AnswerLetter, Question, QuestionGroup } from '../types';

// ─── Timer Component ────────────────────────────────────────────────────────────
function Timer({ totalSeconds, onExpire }: { totalSeconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }
    const id = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = remaining / totalSeconds;
  const isCritical = remaining <= 300; // 5 min
  const isUrgent = remaining <= 60;

  return (
    <div className={`timer ${isCritical ? 'timer--critical' : ''} ${isUrgent ? 'timer--urgent' : ''}`}>
      <span className="timer__label">Waktu</span>
      <span className="timer__display" id="quiz-timer">
        {String(mins).padStart(2, '0')}
        <span className="timer__colon">:</span>
        {String(secs).padStart(2, '0')}
      </span>
      <div className="timer__bar">
        <div className="timer__bar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

// ─── Answer Choice Component ───────────────────────────────────────────────────
function AnswerChoice({
  letter,
  text,
  state,
  onClick,
  disabled,
}: {
  letter: AnswerLetter;
  text: string;
  state: 'idle' | 'selected' | 'correct' | 'wrong' | 'reveal';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      className={`answer-choice answer-choice--${state}`}
      onClick={onClick}
      disabled={disabled}
      id={`choice-${letter}`}
    >
      <span className="answer-choice__letter">{letter}</span>
      <span className="answer-choice__text">{text}</span>
      {state === 'correct' && <span className="answer-choice__icon">✓</span>}
      {state === 'wrong' && <span className="answer-choice__icon">✗</span>}
    </button>
  );
}

// ─── Passage Panel ─────────────────────────────────────────────────────────────
function PassagePanel({ group }: { group: QuestionGroup }) {
  return (
    <div className="passage-panel" id="passage-panel">
      <div className="passage-panel__header">
        <span className="passage-panel__range">Soal {group.passageRange}</span>
        <span className="passage-panel__badge">Bacaan</span>
      </div>
      <div className="passage-panel__text">
        {group.passage}
      </div>
    </div>
  );
}

// ─── Main Quiz Page ────────────────────────────────────────────────────────────
export default function Quiz() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { startSession, saveAnswer, completeTest } = useProgressStore();
  const { level } = useAccessStore();

  const test = testId ? getTestById(testId) : undefined;

  // Access check
  useEffect(() => {
    if (testId && !isTestUnlocked(testId, level)) {
      navigate('/', { replace: true });
    }
  }, [testId, level, navigate]);

  // Flatten all questions in order
  const allQuestions: { question: Question; group: QuestionGroup }[] = [];
  test?.questionGroups.forEach(g => {
    g.questions.forEach(q => allQuestions.push({ question: q, group: g }));
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerLetter>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAnswer, setFeedbackAnswer] = useState<AnswerLetter | null>(null);
  const [mobileTab, setMobileTab] = useState<'passage' | 'question'>('question');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (testId && isTestUnlocked(testId, level)) startSession(testId);
  }, [testId, level]);

  const handleExpire = useCallback(() => {
    if (!isSubmitted) handleFinish();
  }, [isSubmitted]);

  const handleSelect = (letter: AnswerLetter) => {
    if (showFeedback || isSubmitted) return;
    const q = allQuestions[currentIdx]?.question;
    if (!q) return;

    setFeedbackAnswer(letter);
    setShowFeedback(true);
    const newAnswers = { ...answers, [q.number]: letter };
    setAnswers(newAnswers);
    saveAnswer(q.number, letter);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setFeedbackAnswer(null);
    if (currentIdx < allQuestions.length - 1) {
      setCurrentIdx(i => i + 1);
      setMobileTab('question');
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setShowFeedback(false);
      setFeedbackAnswer(null);
      setCurrentIdx(i => i - 1);
    }
  };

  const handleFinish = useCallback(() => {
    if (isSubmitted || !testId) return;
    setIsSubmitted(true);

    const score = allQuestions.filter(({ question }) => {
      return answers[question.number] === question.correctAnswer;
    }).length;

    completeTest(testId, score, allQuestions.length);
    navigate(`/results/${testId}`);
  }, [isSubmitted, testId, answers, allQuestions, completeTest, navigate]);

  if (!test) {
    return (
      <div className="quiz-error page-enter">
        <h2>Test tidak ditemukan</h2>
        <button onClick={() => navigate('/')}>← Kembali</button>
      </div>
    );
  }

  const current = allQuestions[currentIdx];
  const q = current.question;
  const group = current.group;
  const progressPct = ((currentIdx + 1) / allQuestions.length) * 100;
  const isAnswered = answers[q.number] !== undefined;
  const isLast = currentIdx === allQuestions.length - 1;

  const getChoiceState = (letter: AnswerLetter) => {
    if (!showFeedback) {
      return feedbackAnswer === letter ? 'selected' : 'idle';
    }
    if (letter === q.correctAnswer) return 'correct';
    if (letter === feedbackAnswer && feedbackAnswer !== q.correctAnswer) return 'wrong';
    return 'idle';
  };

  return (
    <div className="quiz page-enter">
      {/* ── Top Progress Bar ─────────────────────────────────────────────── */}
      <div className="global-progress">
        <div className="global-progress__fill" style={{ transform: `scaleX(${progressPct / 100})` }} />
      </div>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="quiz__topbar">
        <button className="quiz__back" onClick={() => navigate('/')} id="btn-back-home">
          ← Beranda
        </button>

        <div className="quiz__info">
          <span className="quiz__test-title">{test.title}</span>
          <span className="quiz__counter" id="question-counter">
            Soal <strong>{currentIdx + 1}</strong> / {allQuestions.length}
          </span>
        </div>

        <div className="quiz__topbar-right">
          <ThemeToggle />
          <Timer
            totalSeconds={test.timerMinutes * 60}
            onExpire={handleExpire}
          />
        </div>
      </header>

      {/* ── Mobile Tab Toggle ────────────────────────────────────────────── */}
      <div className="quiz__mobile-tabs">
        <button
          className={`quiz__tab ${mobileTab === 'passage' ? 'quiz__tab--active' : ''}`}
          onClick={() => setMobileTab('passage')}
          id="tab-passage"
        >
          Bacaan
        </button>
        <button
          className={`quiz__tab ${mobileTab === 'question' ? 'quiz__tab--active' : ''}`}
          onClick={() => setMobileTab('question')}
          id="tab-question"
        >
          Pertanyaan
        </button>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="quiz__body">
        {/* Passage Panel */}
        <div className={`quiz__passage-col ${mobileTab === 'passage' ? 'quiz__col--visible' : 'quiz__col--hidden'}`}>
          <PassagePanel group={group} />
        </div>

        {/* Divider */}
        <div className="quiz__divider" aria-hidden />

        {/* Question Panel */}
        <div className={`quiz__question-col ${mobileTab === 'question' ? 'quiz__col--visible' : 'quiz__col--hidden'}`}>
          <div className="question-panel" id="question-panel">
            {/* Question number */}
            <div className="question-panel__num-row">
              <span className="question-panel__num">{q.number}</span>
              <span className="question-panel__num-label">Pertanyaan</span>
            </div>

            {/* Question text */}
            <p className="question-panel__text">{q.text}</p>

            {/* Feedback message */}
            {showFeedback && (
              <div className={`feedback-msg ${feedbackAnswer === q.correctAnswer ? 'feedback-msg--correct' : 'feedback-msg--wrong'}`}>
                {feedbackAnswer === q.correctAnswer
                  ? '✓ Jawaban benar!'
                  : `✗ Salah. Jawaban yang tepat: ${q.correctAnswer}`}
              </div>
            )}

            {/* Answer choices */}
            <div className="question-panel__choices">
              {(['A', 'B', 'C', 'D'] as AnswerLetter[]).map(letter => (
                q.options[letter] ? (
                  <AnswerChoice
                    key={letter}
                    letter={letter}
                    text={q.options[letter]}
                    state={getChoiceState(letter)}
                    onClick={() => handleSelect(letter)}
                    disabled={showFeedback}
                  />
                ) : null
              ))}
            </div>

            {/* Navigation */}
            <div className="question-panel__nav">
              <button
                className="btn-nav btn-nav--secondary"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                id="btn-prev"
              >
                ← Sebelumnya
              </button>

              {showFeedback ? (
                <button
                  className="btn-nav btn-nav--primary"
                  onClick={handleNext}
                  id="btn-next"
                >
                  {isLast ? 'Lihat Hasil →' : 'Soal Berikutnya →'}
                </button>
              ) : (
                <button
                  className="btn-nav btn-nav--primary"
                  onClick={handleNext}
                  disabled={!isAnswered && !showFeedback}
                  id="btn-skip"
                >
                  {isLast ? 'Selesai →' : 'Lewati →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
