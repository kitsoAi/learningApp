"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { questApi } from "@/lib/api/courses";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { useAuthStore } from "@/store/auth";

export default function QuestsPage() {
  const { user } = useAuthStore();
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const data = await questApi.getQuests();
        setQuests(data);
      } catch (error) {
        console.error("Failed to fetch quests", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={{ title: "Setswana", imageSrc: "/mascot_zebra_happy.png" }}
          hearts={user?.hearts ?? 0}
          points={user?.points ?? 0}
          hasActiveSubscription={false}
        />
      </StickyWrapper>
      <div className="flex-1">
        <div className="w-full flex flex-col items-center">
          <Image
            src="/quests.svg"
            alt="Quests"
            height={90}
            width={90}
          />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Quests
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Complete quests by maintaining your streak and earning points.
          </p>
          <ul className="w-full border-t-2">
            {quests.map((quest) => {
              const progress = (user?.streak_count ?? 0) / quest.required_streak * 100;
              const normalizedProgress = Math.min(progress, 100);

              return (
                <div
                  className="flex items-center w-full p-4 gap-x-4 border-b-2"
                  key={quest.id}
                >
                  <Image
                    src="/points.svg"
                    alt="Points"
                    width={60}
                    height={60}
                  />
                  <div className="flex flex-col gap-y-2 flex-1">
                    <p className="text-neutral-700 text-xl font-bold">
                      {quest.title}
                    </p>
                     <p className="text-neutral-500 text-base">
                      {quest.description}
                    </p>
                    <div className="flex flex-col w-full gap-y-2">
                         <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-orange-500 transition-all"
                                style={{ width: `${normalizedProgress}%` }}
                            />
                         </div>
                         <p className="text-sm text-neutral-500 font-bold">
                            {quest.completed ? "Completed!" : `${user?.streak_count ?? 0} / ${quest.required_streak} days`}
                         </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
