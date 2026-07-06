import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Itinerary } from "@/models/Itinerary";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

// POST — add place
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);
    const { id } = await params;
    const { videoId, placeName, district, thumbnailUrl, notes } = await req.json();
    if (!videoId || !placeName) return apiError("videoId and placeName required", 400);

    const itin = await Itinerary.findOne({ _id: id, userId: user.id });
    if (!itin) return apiError("Itinerary not found", 404);

    const alreadyAdded = itin.places.some((p: { videoId: { toString: () => string } }) => p.videoId.toString() === videoId);
    if (alreadyAdded) return apiSuccess({ itinerary: itin }, "Already in itinerary");

    itin.places.push({ videoId, placeName, district, thumbnailUrl, notes, addedAt: new Date() });
    await itin.save();
    return apiSuccess({ itinerary: itin }, "Place added to itinerary");
  } catch {
    return apiError("Failed", 500);
  }
}

// DELETE — remove place
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);
    const { id } = await params;
    const { videoId } = await req.json();

    const itin = await Itinerary.findOne({ _id: id, userId: user.id });
    if (!itin) return apiError("Itinerary not found", 404);

    itin.places = itin.places.filter((p: { videoId: { toString: () => string } }) => p.videoId.toString() !== videoId);
    await itin.save();
    return apiSuccess({ itinerary: itin }, "Place removed");
  } catch {
    return apiError("Failed", 500);
  }
}
