"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptionButton } from "@/components/games/option-button";
import { ProgressBar } from "@/components/games/progress-bar";
import type { QuizPrompt } from "@/lib/games/setswana-quiz";
import type { SetswanaUiLabels } from "@/types/games";

type QuizCardProps = {
  prompt: QuizPrompt;
  current: number;
  total: number;
  selectedAnswer: string | null;
  isAnswered: boolean;
  isCorrect: boolean;
  labels: SetswanaUiLabels;
  onSelect: (answer: string) => void;
};

export function QuizCard({
  prompt,
  current,
  total,
  selectedAnswer,
  isAnswered,
  isCorrect,
  labels,
  onSelect,
}: QuizCardProps) {
  return (
    <Card className="rounded-[2rem] border-slate-200 shadow-sm">
      <CardHeader className="space-y-4">
        <ProgressBar current={current} total={total} />
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
            {labels.chooseAnswer}
          </p>
          <CardTitle className="text-2xl font-extrabold leading-9 text-slate-900">
            {prompt.question}
          </CardTitle>
          {prompt.imageLabel ? (
            <p className="text-xs font-medium text-slate-500">
              Setshwantsho se ka tsenngwa morago ka `imageLabel: {prompt.imageLabel}`.
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {prompt.options.map((option) => {
          let state: "idle" | "correct" | "wrong" | "revealed" = "idle";

          if (isAnswered && option === prompt.correctAnswer) {
            state = selectedAnswer === prompt.correctAnswer ? "correct" : "revealed";
          } else if (isAnswered && option === selectedAnswer) {
            state = "wrong";
          }

          return (
            <OptionButton
              key={option}
              label={option}
              disabled={isAnswered}
              onClick={() => onSelect(option)}
              state={state}
            />
          );
        })}
        {isAnswered ? (
          <div
            className={`rounded-2xl p-4 text-sm font-semibold ${
              isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
            }`}
          >
            {isCorrect ? labels.correct : `${labels.wrong}. Karabo e e nepagetseng ke: ${prompt.correctAnswer}`}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

