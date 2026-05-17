"use client";

import { Progress } from "@/components/ui/progress";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const value = total === 0 ? 0 : (current / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        <span>Kgatelelo</span>
        <span>{`Potso ${current} / ${total}`}</span>
      </div>
      <Progress value={value} className="h-3 rounded-full bg-slate-200" />
    </div>
  );
}

