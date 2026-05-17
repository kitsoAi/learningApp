"use client";

import { AdminCoursesManager } from "@/components/admin/admin-courses-manager";

export default function AdminCoursesPage() {
  return (
    <AdminCoursesManager
      heading="Courses Manager"
      subheading="Create courses, organize units, and keep lesson content up to date from one dedicated workspace."
      eyebrow="Course Management"
    />
  );
}
