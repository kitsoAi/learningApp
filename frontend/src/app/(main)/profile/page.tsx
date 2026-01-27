'use client';

import { redirect } from "next/navigation";
import Image from "next/image";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { FeedWrapper } from "@/components/feed-wrapper";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth";
import { useCourseStore } from "@/store/course";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { activeCourse } = useCourseStore();

  if (!user || !activeCourse) {
     // redirect('/courses'); // optional
     return null;
  }

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
            <div className="flex flex-col items-center gap-y-6">
                 <Avatar className="bg-green-500 h-[100px] w-[100px]">
                    <AvatarImage
                        className="object-cover"
                        src={user.image_src || "/mascot.svg"}
                    />
                    <AvatarFallback className="bg-green-500 text-white font-bold text-2xl">
                        {user.full_name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-neutral-800">
                        {user.full_name || user.email}
                    </h1>
                     <p className="text-muted-foreground text-md">
                        {user.email}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                        Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <Separator className="my-8" />
            
            <div className="w-full flex flex-col gap-y-4">
                 <h2 className="text-xl font-bold text-neutral-800 mb-2">Statistics</h2>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-x-3 p-4 border rounded-xl shadow-sm">
                         <Image src="/flame.svg" alt="Streak" height={30} width={30} />
                         <div>
                             <p className="font-bold text-neutral-700 text-lg">{user.streak_count}</p>
                             <p className="text-neutral-500 text-sm">Day Streak</p>
                         </div>
                     </div>
                      <div className="flex items-center gap-x-3 p-4 border rounded-xl shadow-sm">
                         <Image src="/flash.svg" alt="XP" height={30} width={30} />
                         <div>
                             <p className="font-bold text-neutral-700 text-lg">{user.xp}</p>
                             <p className="text-neutral-500 text-sm">Total XP</p>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
      </FeedWrapper>
    </div>
  );
}
