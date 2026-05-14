"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Lightbulb, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/games/category-card";
import { QuizCard } from "@/components/games/quiz-card";
import { ResultsScreen } from "@/components/games/results-screen";
import { normalizeCategory, type QuizPrompt } from "@/lib/games/setswana-quiz";
import type { SetswanaCategory, SetswanaGameData } from "@/types/games";

type SetswanaQuizGameProps = {
  data: SetswanaGameData;
};

function iconForCategory(categoryId: SetswanaCategory["id"]) {
  return categoryId === "dithamalakane" ? (
    <Lightbulb className="h-5 w-5 text-amber-500" />
  ) : (
    <Quote className="h-5 w-5 text-emerald-600" />
  );
}

export function SetswanaQuizGame({ data }: SetswanaQuizGameProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<SetswanaCategory["id"] | null>(null);
  const [prompts, setPrompts] = useState<QuizPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const labels = data.uiLabels;
  const activeCategory = useMemo(
    () => data.categories.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId, data.categories],
  );
  const currentPrompt = prompts[currentIndex] ?? null;
  const isAnswered = selectedAnswer !== null;
  const isCorrect = currentPrompt ? selectedAnswer === currentPrompt.correctAnswer : false;
  const isFinished = activeCategory !== null && currentIndex >= prompts.length;

  const startCategory = (category: SetswanaCategory) => {
    setActiveCategoryId(category.id);
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

  const handleNext = () => {
    setSelectedAnswer(null);
    setCurrentIndex((value) => value + 1);
  };

  const handleRetry = () => {
    if (!activeCategory) {
      return;
    }
    startCategory(activeCategory);
  };

  const handleBackToCategories = () => {
    setActiveCategoryId(null);
    setPrompts([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
  };

  if (!activeCategory) {
    return (
      <div className="space-y-8">
        <div className="rounded-[2rem] border border-amber-100 bg-[linear-gradient(135deg,_#fff7ed_0%,_#ffffff_38%,_#f0fdf4_100%)] p-8 shadow-sm">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
              {data.gameTitle}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Reka kitso ka Dithamalakane le Diane
            </h1>
            <p className="mt-3 text-base font-medium leading-7 text-slate-600">
              Tlhopha karolo, arabe dipotso, mme o bone gore o itse Setswana thata jang.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {data.categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              description={category.instruction}
              meta={`${category.items.length} dipotso`}
              accentClassName={
                category.id === "dithamalakane"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }
              onClick={() => startCategory(category)}
            />
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BookOpenText className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Go oketsa dikagare morago</h2>
          </div>
          <div className="mt-4 space-y-2 text-sm font-medium leading-6 text-slate-600">
            <p>Oketsa dingwe tsotlhe mo faeleng `data/setswana-game.json` ka mo dikarolong tse di leng teng.</p>
            <p>Dirisa `imageLabel` go kgokaganya ditshwantsho morago, le `questionAudio` kgotsa `answerAudio` fa o batla medumo.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <ResultsScreen
        labels={labels}
        score={score}
        correctAnswers={correctAnswers}
        wrongAnswers={wrongAnswers}
        onRetry={handleRetry}
        onBackToCategories={handleBackToCategories}
      />
    );
  }

  if (!currentPrompt) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {iconForCategory(activeCategory.id)}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Karolo</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{activeCategory.title}</h2>
          </div>
        </div>
        <Button variant="outline" onClick={handleBackToCategories}>
          {labels.backToCategories}
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
        <Button variant="secondary" onClick={handleNext} disabled={!isAnswered}>
          {labels.next}
        </Button>
      </div>
    </div>
  );
}

