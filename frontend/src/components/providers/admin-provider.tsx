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
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If we're on the login page, don't redirect or check strict admin yet
      if (pathname === "/admin/login") {
        setIsChecking(false);
        return;
      }

      // If not authenticated, try to fetch user (maybe persisted token)
      if (!isAuthenticated) {
        try {
          await fetchUser();
        } catch (error) {
           // Fetch failed, distinct from just not being logged in
        }
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, pathname, fetchUser]);

  // Effect to handle redirection after check is done
  useEffect(() => {
      if (isChecking) return;
      if (pathname === "/admin/login") return;

      if (!isAuthenticated || !user) {
          router.push("/admin/login");
      } else if (!user.is_admin) {
          router.push("/learn"); // Or some "unauthorized" page
      }
  }, [isChecking, isAuthenticated, user, router, pathname]);


  if (isChecking) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // If not checking, and on login page, render children
  if (pathname === "/admin/login") {
      return <>{children}</>;
  }

  // Guard: If not admin (and not on login page), don't render content (effect will redirect)
  if (!isAuthenticated || !user?.is_admin) {
      return null; 
  }

  return <>{children}</>;
};
