import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const video = await Video.findById(id)
      .populate("creatorId", "fullName profileImage district isVerified bio")
      .lean();

    if (!video) return apiError("Video not found", 404);
    if (video.status !== "APPROVED") return apiError("Video not available", 403);

    // Increment views
    await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return apiSuccess({ video });
  } catch {
    return apiError("Failed to load video", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);

    const { id } = await params;
    const video = await Video.findById(id);
    if (!video) return apiError("Video not found", 404);

    const isOwner = video.creatorId.toString() === user.id;
    const isAdmin = user.role === "ADMIN";
    if (!isOwner && !isAdmin) return apiError("Not authorized", 403);

    await Video.findByIdAndDelete(id);
    return apiSuccess(null, "Video deleted");
  } catch {
    return apiError("Failed to delete video", 500);
  }
}
