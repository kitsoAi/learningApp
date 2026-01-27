"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function CourseRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const courseId = params.courseId;
    if (courseId) {
      // In a real app, we'd update the user's active course on the backend
      // and update the local store.
      // For now, we'll store it in localStorage or just redirect to learn with the param.
      localStorage.setItem("activeCourseId", courseId as string);
      router.push("/learn");
    }
  }, [params.courseId, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-lg">Selecting course...</div>
    </div>
  );
}
