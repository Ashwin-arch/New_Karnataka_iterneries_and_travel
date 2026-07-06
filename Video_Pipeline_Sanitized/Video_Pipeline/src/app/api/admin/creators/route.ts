import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "ADMIN") return apiError("Admin only", 403);

    const { searchParams } = new URL(req.url);
    const role   = searchParams.get("role") || "CREATOR";
    const search = searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { role };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email:    { $regex: search, $options: "i" } },
      ];
    }

    const creators = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess({ creators });
  } catch {
    return apiError("Failed to load creators", 500);
  }
}
