import mongoose, { Schema } from "mongoose";

const VideoSchema = new Schema(
  {
    title:              { type: String, required: true, trim: true, maxlength: 100 },
    description:        { type: String, required: true, maxlength: 500 },
    category:           { type: String, enum: ["NATURE","HERITAGE","FOOD","TREKKING","WATERFALL","CULTURE","HIDDEN_GEM","TEMPLE","BEACH","WILDLIFE"], required: true },
    tags:               [{ type: String, trim: true }],
    placeName:          { type: String, required: true, trim: true },
    district:           { type: String, required: true },
    latitude:           { type: Number },
    longitude:          { type: Number },
    videoUrl:           { type: String, required: true },
    thumbnailUrl:       { type: String },
    cloudinaryPublicId: { type: String, required: true },
    creatorId:          { type: Schema.Types.ObjectId, ref: "User", required: true },
    status:             { type: String, enum: ["PENDING","APPROVED","REJECTED"], default: "PENDING" },
    rejectionReason:    { type: String },
    views:              { type: Number, default: 0 },
    likesCount:         { type: Number, default: 0 },
    commentsCount:      { type: Number, default: 0 },
    sharesCount:        { type: Number, default: 0 },
    savesCount:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

VideoSchema.index({ status: 1, createdAt: -1 });
VideoSchema.index({ creatorId: 1, status: 1 });
VideoSchema.index({ district: 1, status: 1 });
VideoSchema.index({ category: 1, status: 1 });
// Geo index for nearby queries
VideoSchema.index({ latitude: 1, longitude: 1 });

export const Video = mongoose.models.Video || mongoose.model("Video", VideoSchema);
