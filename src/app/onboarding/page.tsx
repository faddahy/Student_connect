import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Set up your profile" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect("/discover");
  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight">Set up your profile</h1>
      <p className="mt-2 text-ink/60">Signed in as {profile.email}</p>
      <div className="mt-8"><ProfileEditor profile={profile} mode="onboarding" /></div>
    </main>
  );
}
