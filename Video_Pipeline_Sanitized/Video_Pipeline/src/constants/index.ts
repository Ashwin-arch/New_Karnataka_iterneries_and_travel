export const CATEGORIES = [
  { value: "NATURE", label: "Nature", emoji: "🌿" },
  { value: "HERITAGE", label: "Heritage", emoji: "🏛" },
  { value: "FOOD", label: "Food", emoji: "🍛" },
  { value: "TREKKING", label: "Trekking", emoji: "🥾" },
  { value: "WATERFALL", label: "Waterfall", emoji: "💧" },
  { value: "CULTURE", label: "Culture", emoji: "🎭" },
  { value: "HIDDEN_GEM", label: "Hidden Gem", emoji: "💎" },
  { value: "TEMPLE", label: "Temple", emoji: "🛕" },
  { value: "BEACH", label: "Beach", emoji: "🏖" },
  { value: "WILDLIFE", label: "Wildlife", emoji: "🐘" },
] as const;

export const KARNATAKA_DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
  "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan",
  "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
  "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura",
  "Yadgir",
];

export const VIDEO_STATUS = {
  PENDING: { label: "Pending Review", color: "text-amber-500", bg: "bg-amber-500/10" },
  APPROVED: { label: "Approved", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  REJECTED: { label: "Rejected", color: "text-red-500", bg: "bg-red-500/10" },
} as const;

export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const JWT_COOKIE_NAME = "ik_token";
export const FEED_PAGE_SIZE = 10;
