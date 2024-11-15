"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth) {
        throw new Error("Firebase auth not initialized");
      }

      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Success",
        description: "Successfully logged in!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      const errorMessage = (() => {
        switch (error.code) {
          case 'auth/invalid-email':
            return 'Invalid email address';
          case 'auth/user-disabled':
            return 'This account has been disabled';
          case 'auth/user-not-found':
            return 'No account found with this email';
          case 'auth/wrong-password':
            return 'Incorrect password';
          default:
            return error.message || 'An error occurred during login';
        }
      })();

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Car className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-white dark:bg-neutral-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="bg-white dark:bg-neutral-900"
            />
          </div>

          <Button 
            className="w-full" 
            type="submit" 
            disabled={loading || !email || !password}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}