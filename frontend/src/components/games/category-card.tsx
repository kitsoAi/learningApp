"use client";

import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CategoryCardProps = {
  title: string;
  description: string;
  meta: string;
  accentClassName: string;
  onClick: () => void;
};

export function CategoryCard({
  title,
  description,
  meta,
  accentClassName,
  onClick,
}: CategoryCardProps) {
  return (
    <button className="w-full text-left" onClick={onClick} type="button">
      <Card className="group rounded-[2rem] border-slate-200 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
        <CardContent className="p-6">
          <div
            className={cn(
              "mb-5 inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em]",
              accentClassName,
            )}
          >
            {meta}
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{description}</p>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-700">
            Simolola
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

