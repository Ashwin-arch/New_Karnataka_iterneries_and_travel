import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return apiError("Admin only", 403);

    const { id } = await params;
    const video = await Video.findByIdAndDelete(id);
    if (!video) return apiError("Video not found", 404);

    return apiSuccess(null, "Video deleted");
  } catch {
    return apiError("Failed to delete video", 500);
  }
}
