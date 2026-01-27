"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      
      // Check if user is admin (get fresh state)
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-[350px]">
        <CardHeader>
          <div className="w-full flex justify-center mb-4">
               <Image src="/mascot.svg" alt="Mascot" height={80} width={80} />
          </div>
          <CardTitle className="text-center text-2xl">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@puolingo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button variant="link" size="sm" onClick={() => router.push("/")}>
                Back to App
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
