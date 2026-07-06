"use client";

import { Play } from "lucide-react";
import { IVideo } from "@/types";

interface Props {
  video: IVideo;
  onClick: () => void;
}

export function StoryCard({ video, onClick }: Props) {
  const creator =
    typeof video.creatorId === "object"
      ? (video.creatorId as { fullName: string; isVerified?: boolean })
      : null;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-52 bg-[#161622] border border-[#2a2a3e] rounded-2xl p-3.5 text-left active:opacity-70 transition-all hover:border-[#7c3aed]/20"
    >
      <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-0.5 font-bold">
        Documentary
      </span>

      <p className="text-[12px] font-bold text-white mt-2 leading-snug line-clamp-3">
        {video.title}
      </p>

      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-[10px] text-[#555577]">{creator?.fullName}</p>
          {creator?.isVerified && (
            <p className="text-[9px] text-[#a78bfa] font-medium">✓ Verified</p>
          )}
        </div>
        <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-white fill-white" />
        </div>
      </div>
    </button>
  );
}
