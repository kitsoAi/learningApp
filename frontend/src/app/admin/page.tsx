"use client";

import { AdminCoursesManager } from "@/components/admin/admin-courses-manager";

export default function AdminPage() {
  return (
    <AdminCoursesManager
      heading="Admin Dashboard"
      subheading="Manage the full course structure, keep lessons organized, and update app content from one place."
    />
  );
}
