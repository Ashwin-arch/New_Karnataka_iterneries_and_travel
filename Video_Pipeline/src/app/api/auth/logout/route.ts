import { clearAuthCookie, getAuthUser } from "@/lib/auth/jwt";
import { apiSuccess } from "@/lib/utils";

export async function POST() {
  await clearAuthCookie();
  return apiSuccess(null, "Logged out successfully");
}
