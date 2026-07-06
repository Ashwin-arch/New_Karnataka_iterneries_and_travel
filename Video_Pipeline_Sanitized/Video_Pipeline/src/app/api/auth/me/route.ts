import { getAuthUser } from "@/lib/auth/jwt";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Not authenticated", 401);
  return apiSuccess({ user });
}
