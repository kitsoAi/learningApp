 "use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { questApi } from "@/lib/api/courses";
import type { QuestProgress } from "@/types/api";

type QuestsProps = {
  points: number;
  streakCount?: number;
};

export const Quests = ({ points, streakCount = 0 }: QuestsProps) => {
  const [quests, setQuests] = useState<QuestProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questApi
      .getQuests()
      .then((data) => {
        setQuests(data);
      })
      .catch(() => {
        setQuests([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4 rounded-xl border-2 p-4">
      <div className="flex w-full items-center justify-between space-y-2">
        <h3 className="text-lg font-bold">Quests</h3>

        <Link href="/quests">
          <Button size="sm" variant="primaryOutline">
            View all
          </Button>
        </Link>
      </div>

      <ul className="w-full space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          quests.slice(0, 3).map((quest) => {
          const progress = Math.min((streakCount / quest.required_streak) * 100, 100);

          return (
            <div
              className="flex w-full items-center gap-x-3 pb-4"
              key={quest.title}
            >
              <Image src="/points.svg" alt="Points" width={40} height={40} />

              <div className="flex w-full flex-col gap-y-2">
                <p className="text-sm font-bold text-neutral-700">
                  {quest.title}
                </p>

                <Progress value={progress} className="h-2" />
                <p className="text-xs font-medium text-neutral-500">
                  {quest.completed ? "Completed" : `${streakCount} / ${quest.required_streak} days`}
                </p>
              </div>
            </div>
          );
        }))}
      </ul>
    </div>
  );
};
