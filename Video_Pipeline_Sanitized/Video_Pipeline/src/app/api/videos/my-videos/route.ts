import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);
    if (user.role !== "CREATOR") return apiError("Creators only", 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const query: Record<string, unknown> = { creatorId: user.id };
    if (status) query.status = status;

    const videos = await Video.find(query).sort({ createdAt: -1 }).lean();
    return apiSuccess({ videos });
  } catch {
    return apiError("Failed to load videos", 500);
  }
}
