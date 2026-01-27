"use client";

import { useEffect, useState } from "react";
import { courseApi } from "@/lib/api/courses";
import { useAuthStore } from "@/store/auth";
import type { Course } from "@/types/api";
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { toast } from "sonner";
import { cn, formatAssetUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.getCourses();
        setCourses(data);
      } catch {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg font-semibold text-neutral-600">Loading courses...</div>
      </div>
    );
  }

  // Use active course from store if available, or first course
  const activeCourse = courses[0] || {
    id: 1,
    title: "Select a course",
    image_src: "/es.svg",
  };

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
            src="/learn.svg"
            alt="Learn"
            height={90}
            width={90}
            className="mb-6"
          />
          <h1 className="text-center font-bold text-neutral-800 text-2xl mb-7">
            Choose a course to start learning
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
            {courses.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-muted-foreground">
                  No courses available yet. Check back soon!
                </p>
              </div>
            ) : (
              courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="group"
                >
                  <div className="border-2 rounded-xl border-b-4 hover:bg-black/5 cursor-pointer active:border-b-2 flex flex-col items-center gap-3 p-6 pb-8 min-h-[217px] min-w-[200px] transition">
                    <div className="relative aspect-[4/3] w-[120px] rounded-lg overflow-hidden drop-shadow-md">
                      {course.image_src && (
                        <Image
                          src={formatAssetUrl(course.image_src) || ""}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <p className="text-neutral-700 text-center font-bold text-lg">
                      {course.title}
                    </p>
                    {course.description && (
                      <p className="text-neutral-500 text-center text-sm">
                        {course.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
}
