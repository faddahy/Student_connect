"use server";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAccount() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();
  const { data: files } = await admin.storage.from("photos").list(user.id);
  if (files?.length) await admin.storage.from("photos").remove(files.map((f) => `${user.id}/${f.name}`));
  await admin.auth.admin.deleteUser(user.id); // cascades to profile, swipes, matches, messages
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
