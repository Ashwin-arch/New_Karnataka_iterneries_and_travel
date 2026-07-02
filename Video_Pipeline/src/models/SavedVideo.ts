import mongoose, { Schema } from "mongoose";

const SavedVideoSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
  },
  { timestamps: true }
);

SavedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });
SavedVideoSchema.index({ userId: 1, createdAt: -1 });

export const SavedVideo =
  mongoose.models.SavedVideo || mongoose.model("SavedVideo", SavedVideoSchema);
