import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { signToken, setAuthCookie } from "@/lib/auth/jwt";
import { validateLogin } from "@/validations";
import { apiError, apiSuccess } from "@/lib/utils";
import { AuthUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const error = validateLogin(body);
    if (error) return apiError(error, 400);

    const { email, password } = body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return apiError("Invalid email or password", 401);
    if (!user.isActive) return apiError("Account has been deactivated", 403);

    const isValid = await user.comparePassword(password);
    if (!isValid) return apiError("Invalid email or password", 401);

    const payload: AuthUser = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      district: user.district,
    };

    const token = signToken(payload);
    await setAuthCookie(token);

    return apiSuccess({ user: payload }, "Logged in successfully");
  } catch (err) {
    console.error("Login error:", err);
    return apiError("Something went wrong", 500);
  }
}
