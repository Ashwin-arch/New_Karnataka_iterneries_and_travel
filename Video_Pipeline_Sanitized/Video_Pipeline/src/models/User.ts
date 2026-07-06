/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new Schema(
  {
    fullName:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:     { type: String, required: true, minlength: 8 },
    role:         { type: String, enum: ["EXPLORER", "CREATOR", "ADMIN"], default: "EXPLORER" },
    profileImage: { type: String },
    bio:          { type: String, maxlength: 300 },
    district:     { type: String },
    isVerified:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!(this as any).isModified("password")) return;
  (this as any).password = await bcrypt.hash((this as any).password, 12);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, (this as any).password);
};

UserSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => { delete ret.password; return ret; },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
