"use client";

import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { SidebarItem } from "./sidebar-item";
import { Button } from "./ui/button";

type SidebarProps = {
  className?: string;
};

export const Sidebar = ({ className }: SidebarProps) => {
  const { user, logout } = useAuthStore();

  return (
    <div
      className={cn(
        "left-0 top-0 flex h-full flex-col border-r-2 px-4 lg:fixed lg:w-[256px]",
        className
      )}
    >
      <Link href="/learn">
        <div className="flex items-center gap-x-3 pb-7 pl-4 pt-8">
          <Image src="/zebra_logo.png" alt="Mascot" height={40} width={40} className="rounded-lg shadow-sm" />

          <h1 className="text-2xl font-extrabold tracking-tighter text-[#58cc02]">
            Puolingo
          </h1>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-y-2">
        <SidebarItem label="Learn" href="/learn" iconSrc="/learn.svg" />
        <SidebarItem
          label="Leaderboard"
          href="/leaderboard"
          iconSrc="/leaderboard.svg"
        />
        <SidebarItem label="Quests" href="/quests" iconSrc="/quests.svg" />
        <SidebarItem label="Shop" href="/shop" iconSrc="/shop.svg" />
      </div>

      <div className="p-4">
        {user ? (
          <div className="flex items-center gap-x-2">
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
            >
              Logout
            </Button>
          </div>
        ) : (
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
};
