import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

interface Car {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
  userId: string;
  createdAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const searchTerm = searchParams.get('search')?.toLowerCase() || '';
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);

    try {
      // Basic query
      let querySnapshot;
      
      if (userId) {
        querySnapshot = await adminDb
          .collection('cars')
          .where('userId', '==', userId)
          .get();
      } else {
        querySnapshot = await adminDb
          .collection('cars')
          .get();
      }

      if (querySnapshot.empty) {
        return NextResponse.json([]);
      }

      // Map and filter results
      const cars = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          title: doc.data().title || '',
          description: doc.data().description || '',
          tags: doc.data().tags || [],
          images: doc.data().images || []
        } as Car))
        .filter(car => {
          if (!searchTerm) return true;
          return (
            car.title.toLowerCase().includes(searchTerm) ||
            car.description.toLowerCase().includes(searchTerm) ||
            car.tags.some(tag => tag.toLowerCase().includes(searchTerm))
          );
        });

      return NextResponse.json(cars);

    } catch (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.uid !== data.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use adminDb instead of getFirestore()
    const docRef = adminDb.collection("cars").doc();
    await docRef.set({
      id: docRef.id, // Add the document ID to the data
      title: data.title,
      description: data.description,
      tags: data.tags,
      images: data.images,
      userId: decodedToken.uid,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error("Error creating car:", error);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    );
  }
}