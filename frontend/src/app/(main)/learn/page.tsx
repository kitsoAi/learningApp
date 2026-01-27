'use client'

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useCourseStore } from "@/store/course";
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { Header } from "@/components/learn/header";
import { Unit } from "@/components/learn/unit";
import { useRouter } from "next/navigation";

export default function LearnPage() {
  const { user } = useAuthStore();
  const { activeCourse: course, isLoading, fetchCourse, error } = useCourseStore();
  const router = useRouter();

  useEffect(() => {
    const activeCourseId = localStorage.getItem("activeCourseId");
    
    if (!activeCourseId) {
      router.push("/courses");
      return;
    }

    // Only fetch if not already loaded or if we want to ensure freshness on mount
    // For now, always fetch to get latest progress
    fetchCourse(parseInt(activeCourseId));
  }, [fetchCourse, router]);

  useEffect(() => {
    if (!isLoading && !course && error) {
      // If course fails to load (likely deleted/invalid), redirect to courses selection
      localStorage.removeItem("activeCourseId");
      router.push("/courses");
    }
  }, [isLoading, course, error, router]);

  if (isLoading || !user || !course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg font-semibold text-neutral-600">
          {error ? "Redirecting to courses..." : "Loading your progress..."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={{
            title: course.title,
            imageSrc: course.image_src || "/es.svg",
          }}
          hearts={user.hearts}
          points={user.points}
          hasActiveSubscription={false}
        />
        <Promo />
        <Quests points={user.points} />
      </StickyWrapper>
      <FeedWrapper>
        <Header title={course.title} />
        {course.units?.map((unit) => (
          <div key={unit.id} className="mb-10">
            <Unit
              id={unit.id}
              order={unit.order_index}
              description={unit.description || ""}
              title={unit.title}
              lessons={unit.lessons || []}
              activeLesson={unit.lessons?.find(l => !l.completed)} 
              activeLessonPercentage={0} // TODO: Calculate internal lesson progress if needed
              locked={unit.locked}
            />
          </div>
        ))}
      </FeedWrapper>
    </div>
  );
}

