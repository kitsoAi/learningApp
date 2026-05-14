"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export default function GamesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      fetchUser();
    }
  }, [fetchUser, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fee7_0%,_#ffffff_26%,_#f8fafc_100%)]">
      <header className="border-b border-emerald-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
          <Link href="/learn" className="flex items-center gap-3">
            <Image src="/zebra_logo.png" alt="Puolingo" width={42} height={42} className="rounded-xl shadow-sm" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Puolingo</p>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Games</h1>
            </div>
          </Link>
          <Button asChild variant="outline">
            <Link href="/learn">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Learning
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-6 py-8">{children}</main>
    </div>
  );
}

