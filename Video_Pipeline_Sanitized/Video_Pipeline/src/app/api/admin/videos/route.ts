import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return apiError("Admin only", 403);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    const videos = await Video.find({ status })
      .populate("creatorId", "fullName email profileImage district")
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess({ videos });
  } catch {
    return apiError("Failed to load videos", 500);
  }
}
