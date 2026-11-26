"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail, isSupabaseConfigured, SITE_URL } from "@/lib/config";

export type FormState = { error?: string; message?: string };

async function enterDemo(next = "/feed") {
  const jar = await cookies();
  jar.set("fs_persona", "ada", { path: "/", sameSite: "lax" });
  redirect(next);
}

function friendly(msg: string): string {
  if (/email not confirmed/i.test(msg))
    return "Please confirm your email first. Check your inbox and spam folder.";
  if (/invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/rate limit/i.test(msg)) return "Too many attempts. Please wait a few minutes and try again.";
  return msg;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const agreed = formData.get("agree") === "on";

  if (!isAllowedEmail(email)) return { error: "Enter a valid email address. Gmail and any other inbox are welcome." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!agreed) return { error: "You must confirm you are 18+ and accept the Terms." };
  if (!isSupabaseConfigured()) await enterDemo("/kyc");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=/onboarding` },
  });
  if (error) return { error: friendly(error.message) };
  return {
    message: `We sent a confirmation link to ${email}. Open it on this device to activate your account (check Spam too).`,
  };
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/feed");
  if (!isSupabaseConfigured()) await enterDemo(next.startsWith("/") && !next.startsWith("//") ? next : "/feed");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message) };
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/feed");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!isAllowedEmail(email)) return { error: "Enter the email on your account." };
  if (!isSupabaseConfigured()) return { message: "Demo mode does not send email. Open the feed to continue." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: friendly(error.message) };
  return { message: "If that account exists, a reset link is on its way." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!isSupabaseConfigured()) await enterDemo("/feed");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendly(error.message) };
  redirect("/feed");
}
