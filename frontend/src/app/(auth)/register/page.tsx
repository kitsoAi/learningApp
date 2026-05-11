"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await register({ email, password, full_name: fullName });
      toast.success("Account created! Welcome to Puolingo!");
      router.push("/learn");
    } catch (error) {
      const message =
        (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
        "Registration failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] p-4 font-sans">
      <Link href="/" className="flex items-center gap-x-3 mb-12 hover:opacity-80 transition group">
        <Image
          src="/zebra_logo.png"
          height={50}
          width={50}
          alt="Logo"
          className="rounded-xl shadow-lg border-2 border-white group-hover:scale-110 transition duration-300"
        />
        <h1 className="text-4xl font-extrabold text-[#58cc02] tracking-tighter">
          Puolingo
        </h1>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 border-2 border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Create Account</h1>
          <p className="text-neutral-500 mt-2 font-medium">
            Start your Setswana learning journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-bold text-neutral-600 uppercase tracking-wide">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#58cc02] transition font-medium"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold text-neutral-600 uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#58cc02] transition font-medium"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-bold text-neutral-600 uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#58cc02] transition font-medium"
              placeholder="Create a password"
            />
            <p className="text-xs text-neutral-500 font-medium">Minimum 8 characters</p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            variant="secondary"
            className="w-full h-[54px] text-lg font-bold"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-8 text-center text-neutral-500 font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-[#58cc02] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
