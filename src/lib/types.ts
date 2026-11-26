export type Gender = "man" | "woman" | "nonbinary";

export interface MyProfile {
  id: string;
  email: string;
  display_name: string | null;
  dob: string | null;
  gender: Gender | null;
  interested_in: Gender[];
  department: string | null;
  level: number | null;
  bio: string | null;
  interests: string[];
  photos: string[];
  onboarded: boolean;
  is_banned: boolean;
  username?: string | null;
  region?: "nigeria" | "africa" | "foreign" | null;
  blue_tick?: boolean;
  kyc_status?: string | null;
  premium_plan?: string | null;
  straight_premium_months?: number;
  straight_active_days?: number;
  earnings_ngn?: number;
  held_ngn?: number;
}

export interface FeedProfile {
  id: string;
  display_name: string;
  age: number;
  gender: Gender;
  department: string | null;
  level: number | null;
  bio: string | null;
  interests: string[];
  photos: string[];
}

export interface MatchRow {
  match_id: string;
  matched_at: string;
  user_id: string;
  display_name: string;
  age: number;
  department: string | null;
  level: number | null;
  bio: string | null;
  interests: string[];
  photos: string[];
  last_message: string | null;
  last_message_at: string | null;
  last_sender: string | null;
}

export interface Message {
  id: string;
  match_id: string;
  sender: string;
  body: string;
  created_at: string;
}
