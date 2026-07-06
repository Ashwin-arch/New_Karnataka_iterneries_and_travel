import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Itinerary } from "@/models/Itinerary";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";
import crypto from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const user = await getAuthUser();
    const itin = await Itinerary.findById(id).lean();
    if (!itin) return apiError("Not found", 404);
    if (!itin.isShared && (!user || itin.userId.toString() !== user.id)) return apiError("Forbidden", 403);
    return apiSuccess({ itinerary: itin });
  } catch {
    return apiError("Failed", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);
    const { id } = await params;
    const body = await req.json();
    const itin = await Itinerary.findOne({ _id: id, userId: user.id });
    if (!itin) return apiError("Not found", 404);

    if (body.title !== undefined) itin.title = body.title.trim();
    if (body.description !== undefined) itin.description = body.description.trim();
    if (body.isShared !== undefined) {
      itin.isShared = body.isShared;
      if (body.isShared && !itin.shareToken) {
        itin.shareToken = crypto.randomBytes(8).toString("hex");
      }
    }
    await itin.save();
    return apiSuccess({ itinerary: itin }, "Updated");
  } catch {
    return apiError("Failed", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);
    const { id } = await params;
    await Itinerary.deleteOne({ _id: id, userId: user.id });
    return apiSuccess(null, "Deleted");
  } catch {
    return apiError("Failed", 500);
  }
}
