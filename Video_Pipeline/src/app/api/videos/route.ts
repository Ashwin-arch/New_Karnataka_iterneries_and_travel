import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";
import { FEED_PAGE_SIZE } from "@/constants";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page     = parseInt(searchParams.get("page")     || "1");
    const limit    = parseInt(searchParams.get("limit")    || String(FEED_PAGE_SIZE));
    const category = searchParams.get("category");
    const district = searchParams.get("district");
    const radiusKm = parseFloat(searchParams.get("radius") || "0");
    const userLat  = parseFloat(searchParams.get("lat")    || "0");
    const userLon  = parseFloat(searchParams.get("lon")    || "0");
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { status: "APPROVED" };
    if (category) query.category = category;
    if (district) query.district = district;

    const [videos, total] = await Promise.all([
      Video.find(query)
        .populate("creatorId", "fullName profileImage district isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit * 3) // fetch extra to filter by radius
        .lean(),
      Video.countDocuments(query),
    ]);

    // Radius filter (client-sent GPS)
    let filtered = videos;
    if (radiusKm > 0 && userLat && userLon) {
      filtered = videos.filter((v) => {
        if (!v.latitude || !v.longitude) return true; // include videos without coords
        const d = haversineKm(userLat, userLon, v.latitude, v.longitude);
        (v as Record<string, unknown>).distanceKm = Math.round(d * 10) / 10;
        return d <= radiusKm;
      });
    }

    const paginated = filtered.slice(0, limit);

    return apiSuccess({
      videos: paginated,
      total,
      page,
      limit,
      hasMore: skip + paginated.length < total,
    });
  } catch (err) {
    console.error(err);
    return apiError("Failed to load feed", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);
    if (user.role !== "CREATOR") return apiError("Only creators can upload videos", 403);

    const body = await req.json();
    const { title, description, category, placeName, district, latitude, longitude, tags, videoUrl, cloudinaryPublicId, thumbnailUrl } = body;
    if (!title || !description || !category || !placeName || !district || !videoUrl || !cloudinaryPublicId) {
      return apiError("Missing required fields", 400);
    }

    const video = await Video.create({
      title: title.trim(), description: description.trim(), category,
      placeName: placeName.trim(), district,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      tags: tags || [], videoUrl, cloudinaryPublicId, thumbnailUrl,
      creatorId: user.id, status: "PENDING",
    });

    return apiSuccess({ video }, "Video submitted for review", 201);
  } catch (err) {
    console.error(err);
    return apiError("Failed to save video", 500);
  }
}
