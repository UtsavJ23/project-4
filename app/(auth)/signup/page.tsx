"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth) {
        throw new Error("Firebase auth not initialized");
      }

      // Validate password length
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      await createUserWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Account created",
        description: "Successfully created your account!",
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      // Handle specific Firebase error codes
      const errorMessage = (() => {
        switch (error.code) {
          case 'auth/email-already-in-use':
            return 'This email is already registered';
          case 'auth/invalid-email':
            return 'Invalid email address';
          case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled';
          case 'auth/weak-password':
            return 'Password is too weak';
          default:
            return error.message || 'An error occurred during sign up';
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
          <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Enter your details to get started
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
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
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="bg-white dark:bg-neutral-900"
            />
          </div>

          <Button 
            className="w-full" 
            type="submit" 
            disabled={loading || !email || password.length < 6}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}