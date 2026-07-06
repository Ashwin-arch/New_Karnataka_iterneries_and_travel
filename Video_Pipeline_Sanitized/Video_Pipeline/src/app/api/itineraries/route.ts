import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Itinerary } from "@/models/Itinerary";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);

    const itineraries = await Itinerary.find({ userId: user.id }).sort({ updatedAt: -1 }).lean();
    return apiSuccess({ itineraries });
  } catch {
    return apiError("Failed to load itineraries", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);

    const { title, description } = await req.json();
    if (!title?.trim()) return apiError("Title is required", 400);

    const itinerary = await Itinerary.create({
      userId: user.id,
      title: title.trim(),
      description: description?.trim(),
      places: [],
    });

    return apiSuccess({ itinerary }, "Itinerary created", 201);
  } catch {
    return apiError("Failed to create itinerary", 500);
  }
}
