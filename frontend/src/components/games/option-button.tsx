"use client";

import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OptionButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  state: "idle" | "correct" | "wrong" | "revealed";
};

export function OptionButton({
  label,
  disabled,
  onClick,
  state,
}: OptionButtonProps) {
  const icon =
    state === "correct" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
    ) : state === "wrong" ? (
      <XCircle className="h-5 w-5 text-rose-700" />
    ) : state === "revealed" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
    ) : (
      <Circle className="h-5 w-5 text-slate-400" />
    );

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-auto w-full justify-start gap-3 rounded-2xl px-4 py-4 text-left normal-case tracking-normal",
        state === "correct" && "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-50",
        state === "wrong" && "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-50",
        state === "revealed" && "border-emerald-300 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-50/70",
      )}
    >
      {icon}
      <span className="text-sm font-semibold leading-6">{label}</span>
    </Button>
  );
}

