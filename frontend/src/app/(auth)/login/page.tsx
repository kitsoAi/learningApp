"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login({ username: email, password });
      toast.success("Welcome back!");
      router.push("/learn");
    } catch (error) {
      const message = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Login failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      <Link href="/" className="flex items-center gap-x-3 mb-12 hover:opacity-80 transition group">
        <Image src="/zebra_logo.png" height={50} width={50} alt="Logo" className="rounded-xl shadow-lg border-2 border-white group-hover:scale-110 transition duration-300" />
        <h1 className="text-4xl font-extrabold text-[#58cc02] tracking-tighter">
          Puolingo
        </h1>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 border-2 border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-800 tracking-tight">Login</h2>
          <p className="text-neutral-500 mt-2 font-medium">Continue your language journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-neutral-600 uppercase tracking-wide">
              Email / Username
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#58cc02] transition font-medium"
              placeholder="Enter email or username"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-bold text-neutral-600 uppercase tracking-wide">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#58cc02] transition font-medium"
              placeholder="Enter password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="secondary"
            className="w-full h-[54px] text-lg font-bold"
          >
            {isLoading ? "Signing in..." : "Login"}
          </Button>
        </form>

        <div className="mt-8 flex items-center gap-x-3">
          <div className="h-[2px] bg-slate-200 flex-1" />
          <span className="text-sm font-bold text-neutral-400 uppercase">Or</span>
          <div className="h-[2px] bg-slate-200 flex-1" />
        </div>

        <Button
          type="button"
          variant="default"
          className="w-full mt-6 h-[54px] border-2 border-b-4 text-neutral-700 bg-white hover:bg-slate-100"
          onClick={async () => {
            try {
              await googleLogin();
              toast.success("Welcome back!");
              router.push("/learn");
            } catch (error) {
              // Error is already handled by the store, but we can log it here
              console.error("Google login error:", error);
            }
          }}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>

        <p className="mt-8 text-center text-neutral-500 font-medium">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#58cc02] font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
