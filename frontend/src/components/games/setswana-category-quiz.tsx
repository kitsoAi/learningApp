"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuizCard } from "@/components/games/quiz-card";
import { ResultsScreen } from "@/components/games/results-screen";
import { normalizeCategory, type QuizPrompt } from "@/lib/games/setswana-quiz";
import type { SetswanaCategory, SetswanaGameData } from "@/types/games";

type SetswanaCategoryQuizProps = {
  category: SetswanaCategory;
  data: SetswanaGameData;
  backHref: string;
  backLabel: string;
};

export function SetswanaCategoryQuiz({
  category,
  data,
  backHref,
  backLabel,
}: SetswanaCategoryQuizProps) {
  const [prompts, setPrompts] = useState<QuizPrompt[]>(() => normalizeCategory(category));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const currentPrompt = prompts[currentIndex] ?? null;
  const labels = data.uiLabels;
  const isAnswered = selectedAnswer !== null;
  const isCorrect = currentPrompt ? selectedAnswer === currentPrompt.correctAnswer : false;
  const isFinished = currentIndex >= prompts.length;

  const retry = () => {
    setPrompts(normalizeCategory(category));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
  };

  const handleSelect = (answer: string) => {
    if (!currentPrompt || selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(answer);
    if (answer === currentPrompt.correctAnswer) {
      setScore((value) => value + data.scoring.correctAnswer);
      setCorrectAnswers((value) => value + 1);
    } else {
      setScore((value) => value + data.scoring.wrongAnswer);
      setWrongAnswers((value) => value + 1);
    }
  };

  const next = () => {
    setSelectedAnswer(null);
    setCurrentIndex((value) => value + 1);
  };

  const scoreSummary = useMemo(
    () => ({ score, correctAnswers, wrongAnswers }),
    [correctAnswers, score, wrongAnswers],
  );

  if (isFinished) {
    return (
      <ResultsScreen
        labels={labels}
        score={scoreSummary.score}
        correctAnswers={scoreSummary.correctAnswers}
        wrongAnswers={scoreSummary.wrongAnswers}
        onRetry={retry}
        onBackToCategories={() => {
          window.location.href = backHref;
        }}
      />
    );
  }

  if (!currentPrompt) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Karolo</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{category.title}</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">{category.instruction}</p>
        </div>
        <Button asChild variant="outline">
          <a href={backHref}>{backLabel}</a>
        </Button>
      </div>

      <QuizCard
        prompt={currentPrompt}
        current={currentIndex + 1}
        total={prompts.length}
        selectedAnswer={selectedAnswer}
        isAnswered={isAnswered}
        isCorrect={isCorrect}
        labels={labels}
        onSelect={handleSelect}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
          Score: {score}
        </div>
        <Button variant="secondary" onClick={next} disabled={!isAnswered}>
          {labels.next}
        </Button>
      </div>
    </div>
  );
}

