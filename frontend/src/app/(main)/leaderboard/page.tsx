'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { FeedWrapper } from "@/components/feed-wrapper";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useCourseStore } from "@/store/course";
import { apiClient } from "@/lib/api"; 

// Quick API call within component for now, or move to lib/api
const getLeaderboard = async () => {
    const res = await apiClient.get('/leaderboard');
    return res.data;
};

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const { activeCourse } = useCourseStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  interface LeaderboardEntry {
    id: number;
    full_name?: string;
    email: string;
    image_src?: string;
    xp: number;
  }

  useEffect(() => {
    if (!user || !activeCourse) {
       // redirect('/courses'); // optional
    }
    
    getLeaderboard().then(data => {
        setLeaderboard(data);
        setLoading(false);
    });
  }, [user, activeCourse]);

  if (!user || !activeCourse) return null; // or loading spinner

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={{
             title: activeCourse.title,
             imageSrc: activeCourse.image_src || "/es.svg",
          }}
          hearts={user.hearts}
          points={user.points}
          hasActiveSubscription={false}
        />
        <Promo />
        <Quests points={user.points} />
      </StickyWrapper>
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image
            src="/leaderboard.svg"
            alt="Leaderboard"
            height={90}
            width={90}
          />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            See where you stand among other learners in the community.
          </p>
          <Separator className="mb-4 h-0.5 rounded-full" />
          
          {loading ? (
             <div className="text-neutral-500">Loading leaderboard...</div>
          ) : (
              leaderboard.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center w-full p-2 px-4 rounded-xl hover:bg-gray-200/50"
                >
                  <p className="font-bold text-lime-700 mr-4">{index + 1}</p>
                  <Avatar className="border bg-green-500 h-12 w-12 ml-3 mr-6">
                    <AvatarImage
                      className="object-cover"
                      src={item.image_src || "/mascot.svg"}
                    />
                    <AvatarFallback className="bg-green-500 text-white font-bold">
                        {item.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-neutral-800 flex-1">
                    {item.full_name || item.email}
                  </p>
                  <p className="text-muted-foreground">
                    {item.xp} XP
                  </p>
                </div>
              ))
          )}
        </div>
      </FeedWrapper>
    </div>
  );
}
