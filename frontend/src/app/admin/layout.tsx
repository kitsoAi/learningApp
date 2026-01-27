"use client";

import { usePathname } from "next/navigation";
import { MobileHeader } from "@/components/mobile-header";
import { AdminProvider } from "@/components/providers/admin-provider";
import { AdminSidebar } from "@/components/admin-sidebar";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
};

const AdminLayout = ({ children }: Props) => {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <AdminProvider>
      {!isLoginPage && <AdminSidebar className="hidden lg:flex" />}
      <main className={cn("h-full", !isLoginPage && "lg:pl-[256px]")}>
        <div className={cn("h-full", !isLoginPage && "max-w-[1056px] mx-auto pt-6")}>
          {children}
        </div>
      </main>
    </AdminProvider>
  );
};

export default AdminLayout;
