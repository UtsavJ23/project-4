import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          <Car className="h-20 w-20 text-primary" />
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Car Management System
          </h1>
          <p className="max-w-[600px] text-neutral-500 md:text-xl dark:text-neutral-400">
            Manage your car inventory efficiently. Add, edit, and track your vehicles with ease.
          </p>
          <div className="flex gap-4">
            <Link href="/login">
              <Button size="lg">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}