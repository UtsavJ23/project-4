"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronLeft, X } from "lucide-react";

interface Car {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
}

export default function EditCarPage({ params }: { params: { id: string } }) {
  const [car, setCar] = useState<Car | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await fetch(`/api/cars/${params.id}`, {
          headers: {
            Authorization: `Bearer ${await user?.getIdToken()}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch car");
        const data = await response.json();
        
        // Check if current user is the owner
        if (user?.uid !== data.userId) {
          toast({
            variant: "destructive",
            title: "Unauthorized",
            description: "You can only edit your own cars",
          });
          router.push("/dashboard");
          return;
        }
        
        setCar(data);
        setTitle(data.title);
        setDescription(data.description);
        setTags(data.tags.join(", "));
        setExistingImages(data.images);
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

    if (user) {
      fetchCar();
    }
  }, [params.id, user, toast, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
        });
      }
      return isValid;
    });

    // Check total images limit
    if (validFiles.length + existingImages.length + newImages.length > 10) {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: "You can only have up to 10 images total",
      });
      return;
    }

    // Validate file sizes (max 5MB each)
    const validSizedFiles = validFiles.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024;
      if (!isValidSize) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
        });
      }
      return isValidSize;
    });

    setNewImages(prev => [...prev, ...validSizedFiles]);
    validSizedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setNewImageUrls(prev => [...prev, url]);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!storage || !user) throw new Error("Storage not initialized");

    const timestamp = Date.now();
    // Sanitize filename by removing special characters and spaces
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;
    const storageRef = ref(storage, `cars/${user.uid}/${fileName}`);

    try {
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'originalName': file.name
        }
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(snapshot.ref);
    } catch (error: any) {
      console.error("Upload error:", error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Upload new images sequentially
      const uploadedUrls = [];
      for (const image of newImages) {
        const url = await uploadImage(image);
        uploadedUrls.push(url);
      }

      const response = await fetch(`/api/cars/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          title,
          description,
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          images: [...existingImages, ...uploadedUrls],
          userId: user.uid,
        }),
      });

      if (!response.ok) throw new Error("Failed to update car");

      toast({
        title: "Success",
        description: "Car updated successfully",
      });
      router.push("/dashboard");
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!car) {
    return <div>Car not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Car</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., SUV, Toyota, Dealer"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Existing Images</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {existingImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newImages">Add New Images</Label>
          <Input
            id="newImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {newImageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {newImageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`New Image ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Car"}
          </Button>
        </div>
      </form>
    </div>
  );
}