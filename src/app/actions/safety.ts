"use server";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

const REASONS = ["fake_profile", "harassment", "inappropriate_content", "underage", "scam", "other"];

async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, uid: user.id };
}

export async function reportUser(reported: string, reason: string, details: string, alsoBlock: boolean) {
  if (!isSupabaseConfigured()) return { ok: true };
  const { supabase, uid } = await me();
  if (!REASONS.includes(reason)) return { error: "Pick a reason" };
  const { error } = await supabase.from("reports").insert({ reporter: uid, reported, reason, details: details.slice(0, 1000) || null });
  if (error) return { error: error.message };
  if (alsoBlock) await supabase.from("blocks").insert({ blocker: uid, blocked: reported });
  revalidatePath("/matches");
  return { ok: true };
}

export async function blockUser(blocked: string) {
  if (!isSupabaseConfigured()) return { ok: true };
  const { supabase, uid } = await me();
  const { error } = await supabase.from("blocks").insert({ blocker: uid, blocked });
  if (error && !/duplicate/i.test(error.message)) return { error: error.message };
  revalidatePath("/matches");
  return { ok: true };
}

export async function unmatch(matchId: string) {
  if (!isSupabaseConfigured()) return { ok: true };
  const { supabase } = await me();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) return { error: error.message };
  revalidatePath("/matches");
  return { ok: true };
}
