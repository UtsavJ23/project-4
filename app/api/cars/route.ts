import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const search = searchParams.get('search')?.toLowerCase() || '';
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);
    let query = adminDb.collection('cars');

    // First get all cars for the user if userId is provided
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();
    let cars = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Then filter by search term on the client side for better search functionality
    if (search) {
      cars = cars.filter(car => 
        car.title.toLowerCase().includes(search) || 
        car.description.toLowerCase().includes(search) ||
        car.tags.some((tag: string) => tag.toLowerCase().includes(search))
      );
    }

    return NextResponse.json(cars);
  } catch (error) {
    console.error("Error fetching cars:", error);
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