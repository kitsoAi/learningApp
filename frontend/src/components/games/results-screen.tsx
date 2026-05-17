"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SetswanaUiLabels } from "@/types/games";

type ResultsScreenProps = {
  labels: SetswanaUiLabels;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  onRetry: () => void;
  onBackToCategories: () => void;
};

export function ResultsScreen({
  labels,
  score,
  correctAnswers,
  wrongAnswers,
  onRetry,
  onBackToCategories,
}: ResultsScreenProps) {
  return (
    <Card className="rounded-[2rem] border-slate-200 shadow-sm">
      <CardHeader className="items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <Trophy className="h-8 w-8" />
        </div>
        <CardTitle className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          {labels.results}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Score</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{score}</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Correct</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{correctAnswers}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Wrong</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{wrongAnswers}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" className="flex-1" onClick={onRetry}>
            {labels.retry}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onBackToCategories}>
            {labels.backToCategories}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

