import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return apiError("Not authenticated", 401);
    if (user.role !== "CREATOR") return apiError("Creators only", 403);

    const { folder } = await req.json();
    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

    const str = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha256").update(str).digest("hex");

    return apiSuccess({ signature, timestamp, cloudName, apiKey, folder });
  } catch {
    return apiError("Failed to sign upload", 500);
  }
}
