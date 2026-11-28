import { requireUser } from "@/lib/session";
import { ProfileView } from "@/components/social/ProfileView";
import { personByUsername } from "@/lib/demo/data";
import type { DemoPerson } from "@/lib/demo/data";
import type { Region } from "@/lib/engine";

export const metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const session = await requireUser();
  const { profile } = session;
  if (!profile) return null;
  const person = session.persona ?? personByUsername(profile.username || "") ?? profileAsPerson(profile);
  return <ProfileView person={person} viewer={person.username} self profile={profile} />;
}

function profileAsPerson(profile: NonNullable<Awaited<ReturnType<typeof requireUser>>["profile"]>): DemoPerson {
  return {
    id: profile.id,
    username: profile.username || "you",
    displayName: profile.display_name || "You",
    email: profile.email,
    bio: profile.bio || "",
    region: (profile.region as Region) || "nigeria",
    nigerian: profile.region !== "foreign" && profile.region !== "africa",
    blueTick: Boolean(profile.blue_tick),
    admin: false,
    earningsNgn: profile.earnings_ngn ?? 0,
    plan: (profile.premium_plan as DemoPerson["plan"]) ?? null,
    straightPremiumMonths: profile.straight_premium_months ?? 0,
    straightActiveDays: profile.straight_active_days ?? 0,
    kyc: profile.kyc_status === "approved" || profile.kyc_status === "pending" ? profile.kyc_status : "none",
    gender: profile.gender || "woman",
    age: 21,
    department: profile.department || "Other",
    level: profile.level || 100,
    interests: profile.interests,
    color: "#2563eb",
    follows: ["yagyok"],
  };
}
