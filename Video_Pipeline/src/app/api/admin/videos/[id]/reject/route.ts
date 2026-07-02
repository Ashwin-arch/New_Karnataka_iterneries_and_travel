import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Video } from "@/models/Video";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user || user.role !== "ADMIN") return apiError("Admin only", 403);

    const { id } = await params;
    const body = await req.json();
    const { reason } = body;

    if (!reason?.trim()) return apiError("Rejection reason is required", 400);

    const video = await Video.findByIdAndUpdate(
      id,
      { status: "REJECTED", rejectionReason: reason.trim() },
      { new: true }
    );

    if (!video) return apiError("Video not found", 404);
    return apiSuccess({ video }, "Video rejected");
  } catch {
    return apiError("Failed to reject video", 500);
  }
}
