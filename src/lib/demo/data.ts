import type { PostKind, PremiumPlan, Region } from "@/lib/engine";
import type { Gender } from "@/lib/types";

export type PersonaId = "ada" | "tunde" | "yagyok";

export interface DemoPerson {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  region: Region;
  nigerian: boolean;
  blueTick: boolean;
  admin: boolean;
  earningsNgn: number;
  plan: PremiumPlan | null;
  straightPremiumMonths: number;
  straightActiveDays: number;
  kyc: "approved" | "pending" | "none";
  gender: Gender;
  age: number;
  department: string;
  level: number;
  interests: string[];
  color: string;
  follows: string[];
}

export interface DemoComment {
  id: string;
  author: string;
  body: string;
  parentId?: string;
  likes?: string[];
  dislikes?: string[];
}

export interface DemoPost {
  id: string;
  author: string;
  kind: PostKind;
  body: string;
  originalId?: string;
  groupSlug?: string;
  likes: string[];
  dislikes?: string[];
  comments: DemoComment[];
  /** Hidden originals exist so an ad can be reposted without leaving its slot. */
  feedVisible?: boolean;
  sponsored?: boolean;
  viewedBy?: string[];
  shares: number;
  views: number;
  hoursAgo: number;
}

export interface HouseAd {
  id: string;
  username: string;
  name: string;
  copy: string;
  cta: string;
  color: string;
  impressions: number;
  clicks: number;
  spendNgn: number;
}

export interface DemoTransfer {
  id: string;
  username: string;
  region: Region;
  plan: PremiumPlan;
  amountLabel: string;
  reference: string;
  submittedHoursAgo: number;
  status: "pending" | "approved" | "rejected";
}

export interface DemoConfession {
  id: string;
  to: string;
  body: string;
  public: boolean;
  hoursAgo: number;
}

export function avatarUri(label: string, bg: string): string {
  const safe = label.replace(/[<>&"]/g, "").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" rx="36" fill="${bg}"/><text x="80" y="96" text-anchor="middle" font-family="ui-sans-serif,system-ui" font-size="58" font-weight="700" fill="white">${safe}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const PEOPLE: DemoPerson[] = [
  {
    id: "u_yagyok",
    username: "yagyok",
    displayName: "Yagyok",
    email: "yagyok@gmail.com",
    bio: "Founder of Plugin9ja. Building a text-first home for West Africa and everyone who finds us.",
    region: "nigeria",
    nigerian: true,
    blueTick: true,
    admin: true,
    earningsNgn: 48200,
    plan: "fast_track",
    straightPremiumMonths: 6,
    straightActiveDays: 120,
    kyc: "approved",
    gender: "man",
    age: 29,
    department: "Computer Science",
    level: 500,
    interests: ["Startups", "Coding", "Afrobeats"],
    color: "#2563eb",
    follows: [],
  },
  {
    id: "u_ada",
    username: "ada",
    displayName: "Adaeze",
    email: "adaeze.okafor@gmail.com",
    bio: "Product designer in Abuja. I write short notes, play Whot badly, and read every quote I contribute to.",
    region: "nigeria",
    nigerian: true,
    blueTick: true,
    admin: false,
    earningsNgn: 6400,
    plan: "fast_track",
    straightPremiumMonths: 1,
    straightActiveDays: 18,
    kyc: "approved",
    gender: "woman",
    age: 24,
    department: "Information Technology",
    level: 400,
    interests: ["Design", "Afrobeats", "Reading"],
    color: "#7c3aed",
    follows: ["yagyok"],
  },
  {
    id: "u_tunde",
    username: "tunde",
    displayName: "Tunde",
    email: "tunde.balogun@gmail.com",
    bio: "Free member. I mostly distribute posts worth reading twice.",
    region: "nigeria",
    nigerian: true,
    blueTick: false,
    admin: false,
    earningsNgn: 0,
    plan: "monthly",
    straightPremiumMonths: 1,
    straightActiveDays: 6,
    kyc: "pending",
    gender: "man",
    age: 22,
    department: "Electrical & Electronics Engineering",
    level: 300,
    interests: ["Football", "Music", "Tech"],
    color: "#0f766e",
    follows: ["yagyok", "ada"],
  },
  {
    id: "u_chika",
    username: "chika",
    displayName: "Chika",
    email: "chika.n@gmail.com",
    bio: "Blue tick. I quote posts instead of arguing in the replies.",
    region: "nigeria",
    nigerian: true,
    blueTick: true,
    admin: false,
    earningsNgn: 2100,
    plan: "monthly",
    straightPremiumMonths: 3,
    straightActiveDays: 40,
    kyc: "approved",
    gender: "woman",
    age: 23,
    department: "Architecture",
    level: 300,
    interests: ["Art", "Movies", "Photography"],
    color: "#db2777",
    follows: ["yagyok"],
  },
  {
    id: "u_kwame",
    username: "kwame",
    displayName: "Kwame",
    email: "kwame.mensah@gmail.com",
    bio: "Accra. Yearly African plan, still counting active days.",
    region: "africa",
    nigerian: false,
    blueTick: false,
    admin: false,
    earningsNgn: 0,
    plan: "yearly",
    straightPremiumMonths: 2,
    straightActiveDays: 12,
    kyc: "approved",
    gender: "man",
    age: 26,
    department: "Other",
    level: 400,
    interests: ["Business", "Football", "Travel"],
    color: "#b45309",
    follows: ["yagyok"],
  },
  {
    id: "u_lena",
    username: "lena",
    displayName: "Lena",
    email: "lena.okoye@gmail.com",
    bio: "London. Foreign yearly plan, fast-track days completed, waiting on receipt approval.",
    region: "foreign",
    nigerian: false,
    blueTick: false,
    admin: false,
    earningsNgn: 0,
    plan: "yearly",
    straightPremiumMonths: 1,
    straightActiveDays: 30,
    kyc: "approved",
    gender: "woman",
    age: 27,
    department: "Other",
    level: 500,
    interests: ["Reading", "Travel", "Cooking"],
    color: "#0369a1",
    follows: ["yagyok", "ada"],
  },
  {
    id: "u_nora",
    username: "nora",
    displayName: "Nora",
    email: "nora.bello@gmail.com",
    bio: "I post in public groups. Blocks do not hide those.",
    region: "nigeria",
    nigerian: true,
    blueTick: true,
    admin: false,
    earningsNgn: 900,
    plan: "monthly",
    straightPremiumMonths: 4,
    straightActiveDays: 50,
    kyc: "approved",
    gender: "woman",
    age: 25,
    department: "Mass Communication",
    level: 400,
    interests: ["Poetry", "Comedy", "Music"],
    color: "#be123c",
    follows: ["yagyok"],
  },
  {
    id: "u_zara",
    username: "zara",
    displayName: "Zara",
    email: "zara.secret@gmail.com",
    bio: "Verified Secret Zone creator.",
    region: "nigeria",
    nigerian: true,
    blueTick: true,
    admin: false,
    earningsNgn: 14000,
    plan: "fast_track",
    straightPremiumMonths: 5,
    straightActiveDays: 90,
    kyc: "approved",
    gender: "woman",
    age: 28,
    department: "Other",
    level: 500,
    interests: ["Dancing", "Fashion"],
    color: "#9d174d",
    follows: ["yagyok"],
  },
];

export const BLOCKS: Array<[string, string]> = [["ada", "nora"]];

export const GROUPS = [
  {
    slug: "campus-builders",
    name: "Campus Builders",
    about: "A public group for people shipping small products. Blocks do not hide posts here.",
    members: ["ada", "nora", "yagyok", "tunde", "chika"],
  },
];

const comment = (
  id: string,
  author: string,
  body: string,
  extra?: Partial<Pick<DemoComment, "parentId" | "likes" | "dislikes">>,
): DemoComment => ({ id, author, body, likes: [], dislikes: [], ...extra });

export const POSTS: DemoPost[] = [
  {
    id: "p_dist_tunde",
    author: "tunde",
    kind: "distribute",
    body: "",
    originalId: "p_welcome",
    likes: [],
    comments: [],
    shares: 0,
    views: 120,
    hoursAgo: 4,
  },
  {
    id: "p_quote_chika",
    author: "chika",
    kind: "contribute",
    body: "The part I keep coming back to: a repost should not become a second post. If I want my own sentence on it, I contribute. If I only want to pass it on, I distribute — and people talk to the original, not to me.",
    originalId: "p_welcome",
    likes: ["ada", "yagyok", "lena"],
    comments: [
      comment("q1", "ada", "This is the rule I wish every app wrote down.", { likes: ["chika", "yagyok", "lena"] }),
      comment("q1r", "tunde", "That is the line I keep coming back to.", { parentId: "q1", likes: ["ada"] }),
      comment("q2", "yagyok", "And a Contribute post cannot be quoted again. Go back to the original.", { likes: ["ada"] }),
      comment("q3", "tunde", "So my distribute above is just a pointer. Got it.", { likes: ["chika", "ada"] }),
      comment("q4", "lena", "Clearer than a quote-tweet, honestly.", { likes: ["nora"] }),
      comment("q5", "kwame", "The read-only wrapper is the whole idea.", { dislikes: ["chika"] }),
      comment("q6", "nora", "Comments still belong to the person who wrote the sentence.", { likes: ["tunde"], dislikes: ["chika"] }),
      comment("q7", "zara", "Sharing the original, not the echo."),
      comment("q8", "ada", "Unlike also closes the distribution channel. That part is easy to miss.", { likes: ["yagyok"] }),
      comment("q9", "chika", "Yes. Interest has to be fresh after you unlike."),
      comment("q10", "yagyok", "Hourly windows in WAT. Stay online and the channel rolls.", { likes: ["ada", "chika"] }),
      comment("q11", "lena", "Leaving this here so the tenth reply can sit next to a comment ad."),
    ],
    shares: 2,
    views: 410,
    hoursAgo: 3,
  },
  {
    id: "p_welcome",
    author: "yagyok",
    kind: "original",
    body: "Plugin9ja is text-first on purpose. The main feed will not host video, so we can stay on Vercel and Supabase free tiers. Verification, dating, games, and the Secret Zone live beside the feed — not inside it.",
    likes: ["ada", "chika", "tunde", "lena"],
    comments: [
      comment("c1", "ada", "Text-only is the right constraint. The writing has to carry the post."),
      comment("c2", "chika", "Following you by default felt cheeky. I stayed because the notes are good."),
    ],
    shares: 6,
    views: 840,
    hoursAgo: 5,
  },
  {
    id: "p_ada",
    author: "ada",
    kind: "original",
    body: "Small shipping note: blue tick is a manual bank transfer for now. Upload the receipt, wait for @yagyok to approve it, then the earning clock starts. Nigerians can pay ₦1,000 monthly or ₦3,000 to fast-track.",
    likes: ["yagyok", "chika"],
    comments: [comment("a1", "tunde", "The monthly path makes you stay three months. I needed to read that twice.")],
    shares: 1,
    views: 260,
    hoursAgo: 3,
  },
  {
    id: "p_group",
    author: "nora",
    kind: "original",
    body: "Public group post. If you blocked me, you still see this inside Campus Builders. You cannot open my profile or DM me, and I cannot do those to you either.",
    groupSlug: "campus-builders",
    likes: ["tunde"],
    comments: [comment("g1", "yagyok", "That block rule is intentional. Groups stay readable.")],
    shares: 0,
    views: 98,
    hoursAgo: 2,
  },
  {
    id: "p5",
    author: "kwame",
    kind: "original",
    body: "From Accra: the African yearly plan is ₦10,000 and it already includes fast-track. Other paid features stay ₦1,000. I am on day 12 of the 30 active days.",
    likes: ["ada"],
    comments: [],
    shares: 1,
    views: 140,
    hoursAgo: 2,
  },
  {
    id: "p6",
    author: "lena",
    kind: "original",
    body: "Foreign accounts pay $10 a year, deposit at least $10, and nothing on the menu is priced under $10 even when the home currency is softer. Withdrawals start at $50, and you cover the conversion fee.",
    likes: ["yagyok"],
    comments: [],
    shares: 0,
    views: 150,
    hoursAgo: 2,
  },
  {
    id: "p7",
    author: "zara",
    kind: "original",
    body: "The Secret Zone is not in this feed. It is 18+, creator-subscribed, and it does not carry Google ads. If you are looking for that section, it has its own door.",
    likes: ["ada", "chika"],
    comments: [],
    shares: 0,
    views: 188,
    hoursAgo: 1,
  },
  {
    id: "p8",
    author: "yagyok",
    kind: "original",
    body: "Whot and Ludo are the only games. Free tables are open. Paid tables run ₦100 to ₦1,000 in ₦100 steps: 1% to Plugin9ja, then 30% of the net to the host and 70% to the winner.",
    likes: ["tunde", "kwame", "ada"],
    comments: [],
    shares: 3,
    views: 300,
    hoursAgo: 1,
  },
  {
    id: "p9",
    author: "ada",
    kind: "original",
    body: "Dating sits behind the blue tick. The ₦100 fee is a 48-hour hold on earnings. Nothing is deducted until both people confirm, and the hold drops if you unmatch or the window expires.",
    likes: ["chika"],
    comments: [],
    shares: 1,
    views: 210,
    hoursAgo: 1,
  },
  {
    id: "p10",
    author: "chika",
    kind: "original",
    body: "Anonymous notes: blue-tick members can send them. Free members read one out of every three. The other two stay blurred until you upgrade.",
    likes: ["lena", "ada"],
    comments: [],
    shares: 2,
    views: 190,
    hoursAgo: 1,
  },
];

export const ADS: HouseAd[] = [
  {
    id: "ad_peak",
    username: "peakmilk",
    name: "Peak Milk",
    copy: "Breakfast that keeps up with a long lecture day. A tin in the hostel kitchen still counts as a plan.",
    cta: "See the tin",
    color: "#1d4ed8",
    impressions: 12400,
    clicks: 310,
    spendNgn: 80000,
  },
  {
    id: "ad_cowry",
    username: "cowrybank",
    name: "Cowry Bank",
    copy: "Move money without the speech. Cowry is a demo advertiser — your transfer to Plugin9ja still goes to the founder account.",
    cta: "Open Cowry",
    color: "#0f766e",
    impressions: 8600,
    clicks: 190,
    spendNgn: 50000,
  },
  {
    id: "ad_learn",
    username: "naijalearn",
    name: "Naija Learn",
    copy: "Short courses for people who already have a job. Evenings only, no video on this feed.",
    cta: "Browse courses",
    color: "#b45309",
    impressions: 5400,
    clicks: 162,
    spendNgn: 30000,
  },
];

export const TRANSFERS: DemoTransfer[] = [
  {
    id: "tr_tunde",
    username: "tunde",
    region: "nigeria",
    plan: "monthly",
    amountLabel: "₦1,000",
    reference: "FS-TUNDE-1044",
    submittedHoursAgo: 6,
    status: "pending",
  },
  {
    id: "tr_kwame",
    username: "kwame",
    region: "africa",
    plan: "yearly",
    amountLabel: "₦10,000",
    reference: "FS-KWAME-8831",
    submittedHoursAgo: 20,
    status: "pending",
  },
  {
    id: "tr_lena",
    username: "lena",
    region: "foreign",
    plan: "yearly",
    amountLabel: "$10",
    reference: "FS-LENA-2201",
    submittedHoursAgo: 3,
    status: "pending",
  },
];

export const CONFESSIONS: DemoConfession[] = [
  { id: "n1", to: "yagyok", body: "I joined for the dating tab and stayed for the writing. Do not tell the group.", public: true, hoursAgo: 8 },
  { id: "n2", to: "ada", body: "Your fast-track note made me finally pay the ₦3,000. Receipt is in.", public: true, hoursAgo: 7 },
  { id: "n3", to: "yagyok", body: "The distribute rule is the first repost design that does not feel like stealing the replies.", public: true, hoursAgo: 6 },
  { id: "n4", to: "chika", body: "I wanted to quote your quote. The app told me to go back to the original. Fair.", public: true, hoursAgo: 5 },
  { id: "n5", to: "ada", body: "Blocked someone and still saw them in Campus Builders. I thought it was a bug. It is the rule.", public: true, hoursAgo: 4 },
  { id: "n6", to: "yagyok", body: "Whot AI played General Market on me twice. I am not mad. I am writing this anonymously anyway.", public: true, hoursAgo: 3 },
  { id: "n7", to: "lena", body: "The $10 floor is annoying and also the reason I trust the price list.", public: false, hoursAgo: 2 },
  { id: "n8", to: "yagyok", body: "Please keep ads out of the Secret Zone. I will pay the ₦1,000 if the room stays clean.", public: true, hoursAgo: 2 },
  { id: "n9", to: "tunde", body: "Free-member view: you should only be able to read every third note. This one is a test of that lock.", public: true, hoursAgo: 1 },
];

export const SECRET_CREATORS = [
  {
    username: "zara",
    title: "Studio notes",
    about: "Short dance clips for subscribers. Playbacks here are placeholders until storage is connected.",
    subscribers: 42,
  },
  {
    username: "mica",
    title: "Night rehearsals",
    about: "A second verified creator. Same ₦1,000 monthly subscription, same 70/30 month-end split.",
    subscribers: 17,
  },
];

export const BANK = {
  bank: "GTBank",
  accountName: "Plugin9ja",
  accountNumber: "0123456789",
  narration: "Your @username and the plan (monthly, fast-track, or yearly)",
};

export function personByUsername(username: string): DemoPerson | undefined {
  return PEOPLE.find((person) => person.username === username);
}

export function isBlocked(a: string, b: string): boolean {
  return BLOCKS.some(([left, right]) => (left === a && right === b) || (left === b && right === a));
}

export function sharesGroup(a: string, b: string): boolean {
  return GROUPS.some((group) => group.members.includes(a) && group.members.includes(b));
}

/** Ada already has a dating hold on Chika, placed 12 hours ago (36 hours left). */
export const DEMO_DATE_HOLD = {
  from: "ada",
  to: "chika",
  placedHoursAgo: 12,
};
