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
  const { login, isLoading } = useAuthStore();
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
