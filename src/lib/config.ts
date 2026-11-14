export const APP_NAME = "Student Connect";
export const APP_TAGLINE = "Meet FUT Minna students. Verified with your school email.";
export const SCHOOL_NAME = "Federal University of Technology, Minna";

/** Comma-separated list of allowed email domains (UI + app-server check).
 * The database table `allowed_email_domains` is the authoritative check. */
export const ALLOWED_EMAIL_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "st.futminna.edu.ng"
)
  .split(",")
  .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
  .filter(Boolean);

export function isAllowedEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
export const ADSENSE_SLOT_FEED = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED || "";
export const ADSENSE_SLOT_MATCHES = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MATCHES || "";
export const AD_EVERY_N_CARDS = Math.max(
  2,
  parseInt(process.env.NEXT_PUBLIC_AD_EVERY_N_CARDS || "6", 10) || 6,
);

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function photoUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}

export const GENDERS = [
  { value: "man", label: "Man", plural: "Men" },
  { value: "woman", label: "Woman", plural: "Women" },
  { value: "nonbinary", label: "Non-binary", plural: "Non-binary people" },
] as const;

export const LEVELS = [100, 200, 300, 400, 500, 600, 700];

export const DEPARTMENTS = [
  "Agricultural & Bioresources Engineering",
  "Agricultural Economics & Farm Management",
  "Agricultural Extension & Rural Development",
  "Animal Production",
  "Architecture",
  "Biochemistry",
  "Building",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Computer Engineering",
  "Computer Science",
  "Crop Production",
  "Cyber Security Science",
  "Data Science",
  "Electrical & Electronics Engineering",
  "Educational Technology",
  "Entrepreneurship & Business Studies",
  "Estate Management & Valuation",
  "Food Science & Technology",
  "Geography",
  "Geology",
  "Industrial Design",
  "Information Technology",
  "Library & Information Technology",
  "Materials & Metallurgical Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Microbiology",
  "Physics",
  "Plant Biology",
  "Quantity Surveying",
  "Remote Sensing & GIS",
  "Science Education",
  "Soil Science & Land Management",
  "Statistics",
  "Surveying & Geoinformatics",
  "Telecommunication Engineering",
  "Transport Management Technology",
  "Urban & Regional Planning",
  "Water Resources, Aquaculture & Fisheries Technology",
  "Other",
];

export const INTERESTS = [
  "Music", "Football", "Movies", "Gaming", "Afrobeats", "Church", "Mosque",
  "Coding", "Tech", "Fashion", "Cooking", "Reading", "Photography", "Dancing",
  "Fitness", "Travel", "Anime", "Art", "Business", "Comedy", "Basketball",
  "Netflix", "Hiking", "Volunteering", "Startups", "Poetry", "Studying together",
];

export const REPORT_REASONS = [
  { value: "fake_profile", label: "Fake profile / catfish" },
  { value: "harassment", label: "Harassment or threats" },
  { value: "inappropriate_content", label: "Inappropriate photos or messages" },
  { value: "underage", label: "May be under 18" },
  { value: "scam", label: "Scam or asking for money" },
  { value: "other", label: "Something else" },
] as const;
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
