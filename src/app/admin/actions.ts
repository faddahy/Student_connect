"use server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  return createAdminClient();
}

export async function setReportStatus(formData: FormData) {
  const admin = await assertAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["open", "dismissed", "actioned"].includes(status)) return;
  await admin.from("reports").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function banUser(formData: FormData) {
  const admin = await assertAdmin();
  const userId = String(formData.get("userId"));
  await admin.from("profiles").update({ is_banned: true }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" }); // ~100 years
  await admin.from("reports").update({ status: "actioned" }).eq("reported", userId).eq("status", "open");
  revalidatePath("/admin");
}

export async function unbanUser(formData: FormData) {
  const admin = await assertAdmin();
  const userId = String(formData.get("userId"));
  await admin.from("profiles").update({ is_banned: false }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  revalidatePath("/admin");
}
