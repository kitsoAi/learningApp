"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("admin@puolingo.com");
  const [password, setPassword] = useState("admin123");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ username: email, password });

      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.is_admin) {
        toast.error("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }

      toast.success("Welcome back, Admin!");
      router.push("/admin");
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#eef2f7] p-4 font-sans">
      <Link href="/" className="flex items-center gap-x-3 mb-12 hover:opacity-80 transition group">
        <Image
          src="/zebra_logo.png"
          height={50}
          width={50}
          alt="Logo"
          className="rounded-xl shadow-lg border-2 border-white group-hover:scale-110 transition duration-300"
        />
        <div className="flex items-center gap-x-3">
          <h1 className="text-4xl font-extrabold text-[#58cc02] tracking-tighter">
            Puolingo
          </h1>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
            Admin
          </span>
        </div>
      </Link>

      <div className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-800">Admin Login</h2>
          <p className="mt-2 font-medium text-neutral-500">
            Access the content dashboard for lessons, audio, and media.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold uppercase tracking-wide text-neutral-600">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@puolingo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-100 px-4 py-4 font-medium transition focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold uppercase tracking-wide text-neutral-600">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-100 px-4 py-4 font-medium transition focus:border-slate-900 focus:outline-none"
              placeholder="Enter password"
            />
          </div>

          <Button className="h-[54px] w-full text-lg font-bold" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <p className="mt-8 text-center font-medium text-neutral-500">
          Need the learner app?{" "}
          <Link href="/" className="font-bold text-[#58cc02] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
