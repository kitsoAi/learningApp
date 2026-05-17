"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Loader2 } from "lucide-react";

type AdminProviderProps = {
  children: React.ReactNode;
};

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === "/admin/login") {
        setIsChecking(false);
        return;
      }

      if (user?.is_admin) {
        setIsChecking(false);
        return;
      }

      if (!isAuthenticated || !user) {
        try {
          await fetchUser();
        } catch {
          // Ignore; redirect effect below will handle non-admin or missing session.
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, pathname, fetchUser, user]);

  useEffect(() => {
      if (isChecking) return;
      if (pathname === "/admin/login") return;

      if (!isAuthenticated || !user) {
          router.push("/admin/login");
      } else if (!user.is_admin) {
          router.push("/learn");
      }
  }, [isChecking, isAuthenticated, user, router, pathname]);


  if (isChecking) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (pathname === "/admin/login") {
      return <>{children}</>;
  }

  if (!isAuthenticated || !user?.is_admin) {
      return null; 
  }

  return <>{children}</>;
};
