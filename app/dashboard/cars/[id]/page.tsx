"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, Pencil, Trash } from "lucide-react";
import Link from "next/link";

interface Car {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
  ownerId: string;  // Add this line
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const headers: HeadersInit = {};
        if (user) {
          headers.Authorization = `Bearer ${await user.getIdToken()}`;
        }

        const response = await fetch(`/api/cars/${params.id}`, {
          headers,
        });
        
        if (!response.ok) throw new Error("Failed to fetch car");
        const data = await response.json();
        setCar(data);
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

    fetchCar();
  }, [params.id, user, toast]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/cars/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete car");
      toast({
        title: "Success",
        description: "Car deleted successfully",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!car) {
    return <div>Car not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{car.title}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg">
            {car.images[0] && (
              <img
                src={car.images[0]}
                alt={car.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {car.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {car.images.slice(1).map((image, index) => (
                <div key={index} className="aspect-video rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`${car.title} ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{car.description}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {car.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {user && car.ownerId === user.uid && (
            <div className="flex gap-4">
              <Link href={`/dashboard/cars/${params.id}/edit`}>
                <Button>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Car</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this car? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}