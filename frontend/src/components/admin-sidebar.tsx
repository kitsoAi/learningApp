"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, LogOut, BookOpen, BarChart3 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  className?: string;
};

export const AdminSidebar = ({ className }: AdminSidebarProps) => {
  const { logout } = useAuthStore();
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "left-0 top-0 flex h-full flex-col border-r-2 px-4 bg-slate-900 text-white lg:fixed lg:w-[256px]",
        className
      )}
    >
      <Link href="/admin">
        <div className="flex items-center gap-x-3 pb-7 pl-4 pt-8">
           <div className="bg-green-500 rounded-md p-1">
              <Image src="/mascot.svg" alt="Mascot" height={32} width={32} className="object-contain" />
           </div>
          <h1 className="text-xl font-extrabold tracking-wide">
            Admin Panel
          </h1>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-y-2">
        <Link href="/admin">
            <Button 
                variant={pathname === "/admin" ? "secondary" : "ghost"} 
                className={cn("w-full justify-start gap-4", pathname !== "/admin" && "text-slate-400 hover:text-white hover:bg-slate-800")}
            >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
            </Button>
        </Link>
        <Link href="/admin/analytics">
            <Button 
                variant={pathname === "/admin/analytics" ? "secondary" : "ghost"} 
                className={cn("w-full justify-start gap-4", pathname !== "/admin/analytics" && "text-slate-400 hover:text-white hover:bg-slate-800")}
            >
                <BarChart3 className="h-5 w-5" />
                Analytics
            </Button>
        </Link>
        {/* Placeholder for future expansion */}
        <Button variant="ghost" className="w-full justify-start gap-4 text-slate-400 hover:text-white hover:bg-slate-800 cursor-not-allowed opacity-50">
            <BookOpen className="h-5 w-5" />
            Courses (Soon)
        </Button>
      </div>

      <div className="p-4 border-t border-slate-800">
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start gap-4 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
      </div>
    </div>
  );
};
