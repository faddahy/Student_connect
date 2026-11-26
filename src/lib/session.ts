import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { avatarUri, type DemoPerson } from "@/lib/demo/data";
import { readPersona } from "@/lib/demo/persona";
import { createClient } from "@/lib/supabase/server";
import type { MyProfile } from "@/lib/types";

const PROFILE_COLUMNS =
  "id,email,display_name,dob,gender,interested_in,department,level,bio,interests,photos,onboarded,is_banned,username,region,blue_tick,kyc_status,premium_plan,straight_premium_months,straight_active_days,earnings_ngn,held_ngn";

export async function requireUser() {
  if (!isSupabaseConfigured()) {
    const persona = await readPersona();
    return {
      demo: true as const,
      supabase: null,
      user: { id: persona.id, email: persona.email },
      profile: personaToProfile(persona),
      persona,
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).single<MyProfile>();
  return {
    demo: false as const,
    supabase,
    user,
    profile,
    persona: null as DemoPerson | null,
  };
}

function personaToProfile(person: DemoPerson): MyProfile {
  const year = new Date().getFullYear() - person.age;
  return {
    id: person.id,
    email: person.email,
    display_name: person.displayName,
    dob: `${year}-01-15`,
    gender: person.gender,
    interested_in: ["man", "woman", "nonbinary"],
    department: person.department,
    level: person.level,
    bio: person.bio,
    interests: person.interests,
    photos: [avatarUri(person.displayName, person.color)],
    onboarded: true,
    is_banned: false,
    username: person.username,
    region: person.region,
    blue_tick: person.blueTick,
    kyc_status: person.kyc,
    premium_plan: person.plan,
    straight_premium_months: person.straightPremiumMonths,
    straight_active_days: person.straightActiveDays,
    earnings_ngn: person.earningsNgn,
    held_ngn: person.username === "ada" ? 100 : 0,
  };
}
