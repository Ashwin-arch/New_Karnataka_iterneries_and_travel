import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "ADMIN") return apiError("Admin only", 403);

    const { id } = await params;
    const { action } = await req.json();

    const updates: Record<string, unknown> = {};
    if (action === "verify")    updates.isVerified = true;
    if (action === "unverify")  updates.isVerified = false;
    if (action === "suspend")   updates.isActive   = false;
    if (action === "unsuspend") updates.isActive   = true;

    if (Object.keys(updates).length === 0) return apiError("Invalid action", 400);

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    if (!user) return apiError("User not found", 404);

    return apiSuccess({ user }, `Action '${action}' applied`);
  } catch {
    return apiError("Failed", 500);
  }
}
