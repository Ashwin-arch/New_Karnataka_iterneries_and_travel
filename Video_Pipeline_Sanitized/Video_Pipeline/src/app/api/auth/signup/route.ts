import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { signToken, setAuthCookie } from "@/lib/auth/jwt";
import { validateSignup } from "@/validations";
import { apiError, apiSuccess } from "@/lib/utils";
import { AuthUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const error = validateSignup(body);
    if (error) return apiError(error, 400);

    const { fullName, email, password, role } = body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return apiError("Email already registered", 409);

    const user = await User.create({ fullName, email, password, role });

    const payload: AuthUser = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    const token = signToken(payload);
    await setAuthCookie(token);

    return apiSuccess({ user: payload }, "Account created successfully", 201);
  } catch (err) {
    console.error("Signup error:", err);
    return apiError("Something went wrong", 500);
  }
}
