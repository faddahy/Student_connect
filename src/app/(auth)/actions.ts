"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_EMAIL_DOMAINS, isAllowedEmail, SITE_URL } from "@/lib/config";

export type FormState = { error?: string; message?: string };

function friendly(msg: string): string {
  if (/database error saving new user|student email/i.test(msg))
    return `Only FUT Minna student emails (@${ALLOWED_EMAIL_DOMAINS.join(", @")}) can sign up.`;
  if (/email not confirmed/i.test(msg))
    return "Please confirm your email first. Check your school inbox (and Spam).";
  if (/invalid login credentials/i.test(msg)) return "Wrong email or password.";
  if (/rate limit/i.test(msg)) return "Too many attempts. Please wait a few minutes and try again.";
  return msg;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const agreed = formData.get("agree") === "on";

  if (!isAllowedEmail(email))
    return { error: `Use your FUT Minna student email (ending in @${ALLOWED_EMAIL_DOMAINS.join(" or @")}).` };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!agreed) return { error: "You must confirm you are 18+ and accept the Terms." };

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
  const next = String(formData.get("next") || "/discover");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message) };
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/discover");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!isAllowedEmail(email)) return { error: "Enter your FUT Minna student email." };
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
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendly(error.message) };
  redirect("/discover");
}
