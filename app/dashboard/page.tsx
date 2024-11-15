"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

interface Car {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
  userId: string;
}

export default function DashboardPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllCars = async () => {
      if (!user) return;
      try {
        const response = await fetch(
          `/api/cars?search=${searchTerm}`, // Removed userId filter
          {
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch cars");
        const data = await response.json();
        setCars(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllCars();
  }, [user, searchTerm, toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search cars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/dashboard/cars/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Car
          </Button>
        </Link>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cars found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/dashboard/cars/${car.id}`}
              className="block group"
            >
              <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {car.images[0] && (
                  <div className="aspect-video relative">
                    <img
                      src={car.images[0]}
                      alt={car.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {car.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {car.description}
                  </p>
                  {car.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {car.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-secondary px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}