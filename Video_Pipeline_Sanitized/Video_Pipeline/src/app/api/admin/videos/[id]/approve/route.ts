import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return apiError("Admin only", 403);

    const { id } = await params;
    const video = await Video.findByIdAndUpdate(
      id,
      { status: "APPROVED", rejectionReason: undefined },
      { new: true }
    );

    if (!video) return apiError("Video not found", 404);
    return apiSuccess({ video }, "Video approved");
  } catch {
    return apiError("Failed to approve video", 500);
  }
}
