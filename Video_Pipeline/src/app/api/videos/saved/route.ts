import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { SavedVideo } from "@/models/SavedVideo";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);

    const saved = await SavedVideo.find({ userId: user.id })
      .populate({ path: "videoId", populate: { path: "creatorId", select: "fullName profileImage isVerified" } })
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess({ saved });
  } catch {
    return apiError("Failed to load saved videos", 500);
  }
}
