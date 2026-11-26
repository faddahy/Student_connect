import { requireUser } from "@/lib/session";
import { ProfileEditor } from "@/components/ProfileEditor";
import { DeleteAccount } from "./DeleteAccount";
import Link from "next/link";

export const metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const { profile } = await requireUser();
  if (!profile) return null;
  return (
    <main className="px-4">
      <h1 className="mb-1 text-2xl font-extrabold">Your profile</h1>
      <p className="text-sm text-ink/50">{profile.username ? `@${profile.username}` : profile.email}</p>
      <p className="mb-4 text-sm text-ink/50">Following @yagyok</p>
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link href="/verify" className="chip">Blue tick</Link>
        <Link href="/kyc" className="chip">Identity camera</Link>
        <Link href="/wallet" className="chip">Wallet</Link>
        <Link href="/anonymous" className="chip">Anonymous link</Link>
        <Link href="/secret" className="chip">Secret Zone</Link>
      </div>
      <ProfileEditor profile={profile} mode="edit" />
      <div className="mt-10 space-y-3 border-t border-black/5 pt-6">
        <form action="/auth/signout" method="post"><button className="btn-ghost w-full">Sign out</button></form>
        <DeleteAccount />
        <p className="text-center text-xs text-ink/50">
          <Link href="/guidelines" className="underline">Guidelines</Link> · <Link href="/terms" className="underline">Terms</Link> ·{" "}
          <Link href="/privacy" className="underline">Privacy</Link>
        </p>
      </div>
    </main>
  );
}
