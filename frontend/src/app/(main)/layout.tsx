"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchUser();
    }
  }, [isAuthenticated, router, fetchUser]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <MobileHeader />
      <Sidebar className="hidden lg:flex" />
      <main className="lg:pl-[256px] h-full pt-[50px] lg:pt-0">
        <div className="max-w-[1056px] mx-auto pt-6 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
