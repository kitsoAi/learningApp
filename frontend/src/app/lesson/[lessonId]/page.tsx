"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { lessonApi } from "@/lib/api/courses";
import type { Lesson } from "@/types/api";
import { toast } from "sonner";
import { Quiz } from "@/components/lesson/quiz";

export default function LessonPage() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const id = parseInt(params.lessonId as string);
        if (isNaN(id)) throw new Error("Invalid lesson ID");
        
        const data = await lessonApi.getLesson(id);
        setLesson(data);
      } catch (err) {
        toast.error("Failed to load lesson");
        router.push("/learn");
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [params.lessonId, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg font-semibold text-neutral-600 tracking-wide">
          Preparing your lesson...
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  const initialPercentage = lesson.challenges 
    ? (lesson.challenges.filter(c => false).length / lesson.challenges.length) * 100 
    : 0;

  return (
    <Quiz
      initialLessonId={lesson.id}
      initialLessonChallenges={lesson.challenges || []}
      initialHearts={user.hearts}
      initialPercentage={initialPercentage}
      userSubscription={null}
    />
  );
}
