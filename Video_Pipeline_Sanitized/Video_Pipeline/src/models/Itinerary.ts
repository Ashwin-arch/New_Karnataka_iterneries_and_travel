/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema } from "mongoose";

const ItineraryPlaceSchema = new Schema({
  videoId:      { type: Schema.Types.ObjectId, ref: "Video", required: true },
  placeName:    { type: String, required: true },
  district:     { type: String, required: true },
  thumbnailUrl: { type: String },
  notes:        { type: String },
  addedAt:      { type: Date, default: Date.now },
}, { _id: false });

const ItinerarySchema = new Schema(
  {
    userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    title:       { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, maxlength: 300 },
    places:      [ItineraryPlaceSchema],
    isShared:    { type: Boolean, default: false },
    shareToken:  { type: String },
  },
  { timestamps: true }
);

ItinerarySchema.index({ userId: 1, createdAt: -1 });

export const Itinerary =
  mongoose.models.Itinerary || mongoose.model("Itinerary", ItinerarySchema);
