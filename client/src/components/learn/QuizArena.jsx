import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function QuizArena({ api, activeLesson, audioLang }) {
  // Quiz states
  const [quizTopic, setQuizTopic] = useState("Stocks 101");
  const [quizDifficulty, setQuizDifficulty] = useState("easy");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const handleStartQuiz = async () => {
    setLoadingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setQuizCompleted(false);

    try {
      const topicToFetch = activeLesson ? activeLesson.title : quizTopic;
      const res = await api.post("/learn/quiz", {
        topic: topicToFetch,
        difficulty: quizDifficulty,
      });
      if (res.data?.success && res.data?.questions?.length) {
        setQuizQuestions(res.data.questions);
      } else {
        throw new Error("Invalid quiz response structure");
      }
    } catch (e) {
      console.error("Error fetching quiz:", e);
      const fallbackQuestions = [
        {
          q: `What is the safest investment instrument in India?`,
          options: [
            `A) Small-Cap Tech stock`,
            `B) RBI Government Savings Bond`,
            `C) Crypto currency`,
            `D) Penny Stock`,
          ],
          answer: "B",
          explanation: "RBI Government Savings Bonds are 100% sovereign-backed with zero default risk.",
        },
        {
          q: `What does a high Price-to-Earnings (P/E) ratio indicate?`,
          options: [
            `A) Stock is undervalued`,
            `B) High earnings per share`,
            `C) Investors are paying a premium over profits`,
            `D) The company has zero debt`,
          ],
          answer: "C",
          explanation: "A high P/E ratio means investors are paying more per rupee of profit generated.",
        },
        {
          q: `Why do mutual funds offer built-in safety for beginners?`,
          options: [
            `A) They guarantee 20% returns`,
            `B) They pool cash to diversify risk`,
            `C) They never fall in price`,
            `D) They are interest-free`,
          ],
          answer: "B",
          explanation: "Mutual funds pool savings to distribute investments across multiple blue-chips, limiting single-stock downside.",
        },
      ];
      setQuizQuestions(fallbackQuestions);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectAnswer = (optionLetter) => {
    if (selectedAnswer) return; // Prevent changing answer once selected
    setSelectedAnswer(optionLetter);
    const currentQ = quizQuestions[currentQuestionIndex];
    if (optionLetter === currentQ.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 === quizQuestions.length) {
      setQuizCompleted(true);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="card space-y-6 relative overflow-hidden border-amber-500/10 p-6 bg-slate-950 rounded-3xl border shadow-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />

      {!quizQuestions.length ? (
        <div className="space-y-4 relative z-10 text-left">
          <div>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-bold uppercase font-mono border border-amber-500/20">
              Duolingo Quiz Arena
            </span>
            <h3 className="font-black text-xl text-white mt-2">
              Test Your Financial Mastery
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pick a topic, select your difficulty level, and challenge our AI to create custom graded questions.
            </p>
          </div>

          {activeLesson && (
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 p-3.5 rounded-2xl border border-amber-500/20 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div className="text-left">
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">
                    Active Lesson Graded Challenge!
                  </p>
                  <p className="text-[9px] text-slate-300">
                    Complete the active lesson's quiz and earn a <strong>+100 XP</strong> bonus reward!
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono text-amber-400 font-extrabold uppercase shrink-0">
                🔥 Graded
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase font-bold">
                Topic
              </label>
              {activeLesson ? (
                <div className="input-dark py-2.5 px-3 text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between rounded-xl">
                  <span className="truncate">
                    🎓 {activeLesson.title}
                  </span>
                  <span className="text-[7px] bg-amber-500/20 px-2 py-0.5 rounded-full font-mono text-white shrink-0">
                    ACTIVE LOCK
                  </span>
                </div>
              ) : (
                <select
                  className="input-dark py-2.5 text-xs font-bold"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                >
                  <option value="Stocks 101">Stocks 101 Basics</option>
                  <option value="Mutual Funds & SIP">Mutual Funds & SIP</option>
                  <option value="Technical Analysis Indicators">Technical Indicators</option>
                  <option value="Fundamental P/E Ratios">Valuation & P/E</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase font-bold">
                Difficulty
              </label>
              <select
                className="input-dark py-2.5 text-xs font-bold"
                value={quizDifficulty}
                onChange={(e) => setQuizDifficulty(e.target.value)}
              >
                <option value="easy">Easy (Beginner)</option>
                <option value="medium">Medium (Intermediate)</option>
                <option value="hard">Hard (Advanced)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={loadingQuiz}
            className="btn-primary w-full text-xs py-3 font-bold uppercase tracking-wider cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
            }}
          >
            {loadingQuiz
              ? "Generating Graded Questions..."
              : "🏆 Start AI Graded Quiz"}
          </button>
        </div>
      ) : !quizCompleted ? (
        <div className="space-y-4 animate-fade-in relative z-10 font-mono text-left">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>
              Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </span>
            <span>
              Score: {score}/{quizQuestions.length}
            </span>
          </div>

          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
              }}
            />
          </div>

          <h4 className="font-extrabold text-sm text-white pt-2 leading-relaxed">
            {quizQuestions[currentQuestionIndex].q}
          </h4>

          <div key={currentQuestionIndex} className="grid grid-cols-1 gap-2 pt-2">
            {quizQuestions[currentQuestionIndex].options.map((opt, idx) => {
              const optionLetter = opt.trim().charAt(0);
              const isSelected = selectedAnswer === optionLetter;
              const isCorrect = optionLetter === quizQuestions[currentQuestionIndex].answer;

              let optStyle = "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10";
              if (selectedAnswer) {
                if (isCorrect) {
                  optStyle = "border-green-500 bg-green-500/10 text-green-300";
                } else if (isSelected) {
                  optStyle = "border-red-500 bg-red-500/10 text-red-300";
                } else {
                  optStyle = "border-white/5 bg-white/1 opacity-50";
                }
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectAnswer(optionLetter)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all duration-200 lesson-panel-enter lesson-panel-enter-d${(idx % 4) + 1} opacity-0 ${optStyle}`}
                >
                  {opt}
                </div>
              );
            })}
          </div>

          {selectedAnswer && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 animate-fade-in space-y-2 text-left">
              <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> AI Explainer
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {quizQuestions[currentQuestionIndex].explanation}
              </p>
              <button
                onClick={handleNextQuestion}
                className="btn-primary mt-3 text-[10px] py-1.5 w-auto px-4 uppercase font-bold cursor-pointer"
              >
                {currentQuestionIndex + 1 === quizQuestions.length
                  ? "Finish Quiz"
                  : "Next Question ➡️"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 space-y-4 animate-fade-in relative z-10">
          <span className="text-5xl animate-bounce">🏆</span>
          <h3 className="font-black text-2xl text-white">Quiz Completed!</h3>
          <p className="text-xs text-slate-400">
            You scored <span className="text-amber-400 font-black">{score}</span> out of{" "}
            <span className="font-bold">{quizQuestions.length}</span>!
          </p>
          <p className="text-emerald-400 text-xs font-bold">
            +{score * 50} XP Points awarded!
          </p>
          <button
            onClick={() => setQuizQuestions([])}
            className="btn-secondary w-auto px-6 uppercase font-bold cursor-pointer"
          >
            Try Another Quiz
          </button>
        </div>
      )}
    </div>
  );
}
