import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SavedVideo } from "@/models/SavedVideo";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

// POST /api/videos/save  { videoId }  — toggle save
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);

    const { videoId } = await req.json();
    if (!videoId) return apiError("videoId required", 400);

    const existing = await SavedVideo.findOne({ userId: user.id, videoId });
    if (existing) {
      await SavedVideo.deleteOne({ _id: existing._id });
      await Video.findByIdAndUpdate(videoId, { $inc: { savesCount: -1 } });
      return apiSuccess({ saved: false }, "Removed from saved");
    }

    await SavedVideo.create({ userId: user.id, videoId });
    await Video.findByIdAndUpdate(videoId, { $inc: { savesCount: 1 } });
    return apiSuccess({ saved: true }, "Saved!");
  } catch {
    return apiError("Failed to save video", 500);
  }
}

// GET /api/videos/save?videoId=xxx  — check if saved
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiSuccess({ saved: false });

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    if (!videoId) return apiError("videoId required", 400);

    const existing = await SavedVideo.findOne({ userId: user.id, videoId });
    return apiSuccess({ saved: !!existing });
  } catch {
    return apiError("Failed", 500);
  }
}
