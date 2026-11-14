import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MyProfile } from "@/lib/types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,display_name,dob,gender,interested_in,department,level,bio,interests,photos,onboarded,is_banned")
    .eq("id", user.id)
    .single<MyProfile>();
  return { supabase, user, profile };
}
