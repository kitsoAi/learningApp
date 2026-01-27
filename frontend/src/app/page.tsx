"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="h-[70px] border-b-2 border-slate-200 px-4 md:px-10 flex items-center justify-between sticky top-0 bg-white z-50">
        <div className="flex items-center gap-x-3">
          <Image src="/zebra_logo.png" height={40} width={40} alt="Logo" className="rounded-lg" />
          <h1 className="text-2xl font-extrabold text-[#58cc02] tracking-tighter">
            Puolingo
          </h1>
        </div>
        {!user ? (
          <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-600" onClick={() => router.push("/login")}>
            Login
          </Button>
        ) : (
          <Button variant="ghost" className="font-bold text-slate-500 hover:text-slate-600" onClick={() => logout()}>
            Logout
          </Button>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-[1000px] w-full flex flex-col lg:flex-row items-center gap-12 py-12">
          <div className="relative w-[300px] h-[300px] lg:w-[450px] lg:h-[450px]">
            <Image 
              src="/zebra_hero.png" 
              fill 
              alt="Mascot" 
              className="object-contain drop-shadow-2xl animate-float"
            />
          </div>

          <div className="flex flex-col items-center lg:items-start gap-y-8 flex-1">
            <h1 className="text-2xl md:text-5xl font-extrabold text-neutral-800 text-center lg:text-left leading-tight">
              The free, fun, and effective way to learn <span className="text-[#58cc02]">Setswana!</span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-500 font-medium text-center lg:text-left max-w-[500px]">
              Join thousands of learners in Botswana and beyond. Master the language of the zebra with Puolingo.
            </p>

            <div className="flex flex-col gap-y-3 w-full max-w-[330px]">
              {user ? (
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="w-full h-[54px] text-lg"
                  onClick={() => router.push("/learn")}
                >
                  Continue Learning
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="w-full h-[54px] text-lg"
                    onClick={() => router.push("/register")}
                  >
                    Get Started
                  </Button>
                  <Button 
                    size="lg" 
                    variant="default" 
                    className="w-full h-[54px] text-lg border-2 border-b-4"
                    onClick={() => router.push("/login")}
                  >
                    I already have an account
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="hidden lg:block h-20 border-t-2 border-slate-200 p-2">
        <div className="max-w-screen-lg mx-auto flex items-center justify-evenly h-full">
          <div className="flex items-center gap-x-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition cursor-default">
            <span className="font-bold uppercase text-slate-500">Made for Botswana</span>
          </div>
          <div className="flex items-center gap-x-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition cursor-default">
            <span className="font-bold uppercase text-slate-500 text-sm">© 2026 Puolingo</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
