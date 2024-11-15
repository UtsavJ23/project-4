import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

interface CarData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: string[];
  userId: string;
  createdAt: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const carDoc = await adminDb.collection('cars').doc(params.id).get();
    
    if (!carDoc.exists) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    const data = carDoc.data() as CarData;
    return NextResponse.json({
      id: carDoc.id,
      title: data.title || '',
      description: data.description || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      images: Array.isArray(data.images) ? data.images : [],
      userId: data.userId,
      createdAt: data.createdAt
    });

  } catch (error) {
    console.error("Error fetching car:", error);
    return NextResponse.json(
      { error: "Failed to fetch car" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Update car in database
    await adminDb.collection('cars').doc(params.id).update({
      title: data.title,
      description: data.description,
      tags: data.tags,
      images: data.images,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Car updated successfully" });
  } catch (error) {
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    await adminDb.collection('cars').doc(params.id).delete();

    return NextResponse.json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  }
}