"use server";

import { isSupabaseConfigured } from "@/lib/config";
import { regionalWithdrawalMinimum, type Region } from "@/lib/engine";
import { createClient } from "@/lib/supabase/server";

async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" as const };
  return { supabase, user };
}

export async function submitComplaint(body: string) {
  const text = body.trim();
  if (text.length < 3) return { error: "Write a short complaint." };
  if (!isSupabaseConfigured()) return { ok: true as const };
  const current = await session();
  if ("error" in current) return current;
  const { error } = await current.supabase.from("complaints").insert({
    user_id: current.user.id,
    body: text.slice(0, 1000),
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function reportContent(input: {
  targetType: "post" | "comment";
  targetId: string;
  reason: string;
  details: string;
}) {
  if (!input.reason.trim()) return { error: "Pick a reason." };
  if (!isSupabaseConfigured()) return { ok: true as const };
  if (!/^[0-9a-f-]{36}$/i.test(input.targetId)) return { ok: true as const };
  const current = await session();
  if ("error" in current) return current;
  const { error } = await current.supabase.from("content_reports").insert({
    reporter: current.user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason.slice(0, 80),
    details: input.details.slice(0, 1000) || null,
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function requestWithdrawal(amount: number) {
  if (!(Number.isFinite(amount) && amount > 0)) return { error: "Enter an amount." };
  if (!isSupabaseConfigured()) return { ok: true as const };
  const current = await session();
  if ("error" in current) return current;
  const { data: profile } = await current.supabase.from("profiles").select("region").eq("id", current.user.id).single();
  const region = profile?.region as Region | null;
  if (region !== "nigeria" && region !== "africa" && region !== "foreign") {
    return { error: "Set your region before requesting a withdrawal." };
  }
  const minimum = regionalWithdrawalMinimum(region);
  if (amount < minimum.amount) return { error: `Minimum withdrawal is ${minimum.label}.` };
  const { error } = await current.supabase.from("withdrawal_requests").insert({
    user_id: current.user.id,
    region,
    amount,
    currency: minimum.currency,
    status: "pending",
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function createAnonymousGroup(name: string, about: string) {
  const title = name.trim();
  if (title.length < 2) return { error: "Name the group." };
  if (!isSupabaseConfigured()) return { ok: true as const };
  const current = await session();
  if ("error" in current) return current;
  const { data: profile } = await current.supabase.from("profiles").select("blue_tick").eq("id", current.user.id).single();
  if (!profile?.blue_tick) return { error: "Only premium members can create an anonymous group." };
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  if (slug.length < 3) return { error: "Use a longer name." };
  const { data, error } = await current.supabase
    .from("anonymous_groups")
    .insert({
      slug,
      name: title.slice(0, 80),
      about: about.trim().slice(0, 500) || null,
      created_by: current.user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await current.supabase.from("anonymous_group_members").insert({
    group_id: data.id,
    user_id: current.user.id,
  });
  return { ok: true as const, slug };
}
