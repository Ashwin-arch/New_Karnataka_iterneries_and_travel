export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "EXPLORER" | "CREATOR";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VideoUploadInput {
  title: string;
  description: string;
  category: string;
  placeName: string;
  district: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
}

export function validateSignup(data: SignupInput): string | null {
  if (!data.fullName?.trim()) return "Full name is required";
  if (data.fullName.trim().length < 2) return "Full name must be at least 2 characters";
  if (!data.email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Invalid email address";
  if (!data.password) return "Password is required";
  if (data.password.length < 8) return "Password must be at least 8 characters";
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password))
    return "Password must contain uppercase, lowercase, and a number";
  if (data.password !== data.confirmPassword) return "Passwords do not match";
  if (!["EXPLORER", "CREATOR"].includes(data.role)) return "Invalid role";
  return null;
}

export function validateLogin(data: LoginInput): string | null {
  if (!data.email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Invalid email address";
  if (!data.password) return "Password is required";
  return null;
}

export function validateVideoUpload(data: VideoUploadInput): string | null {
  if (!data.title?.trim()) return "Title is required";
  if (data.title.trim().length < 3) return "Title must be at least 3 characters";
  if (data.title.length > 100) return "Title cannot exceed 100 characters";
  if (!data.description?.trim()) return "Description is required";
  if (data.description.length > 500) return "Description cannot exceed 500 characters";
  if (!data.category) return "Category is required";
  if (!data.placeName?.trim()) return "Place name is required";
  if (!data.district) return "District is required";
  return null;
}
