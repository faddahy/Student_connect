import Link from "next/link";
import { notFound } from "next/navigation";
import { avatarUri, isBlocked, personByUsername, sharesGroup } from "@/lib/demo/data";
import { blockView } from "@/lib/engine";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Profile" };

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const person = personByUsername(username);
  if (!person) notFound();
  const session = await requireUser();
  const viewer = session.persona?.username ?? "ada";
  const blocked = viewer !== person.username && isBlocked(viewer, person.username);
  const view = blockView(blocked, sharesGroup(viewer, person.username));

  if (!view.canViewProfile && viewer !== person.username) {
    return (
      <main className="px-4">
        <h1 className="text-2xl font-extrabold">Profile unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          You and @{person.username} have a block in place, so this profile, DMs, and direct interactions are closed.
        </p>
        {view.canSeePublicGroupPost && (
          <Link href="/groups/campus-builders" className="btn-primary mt-5">See the shared public group</Link>
        )}
      </main>
    );
  }

  return (
    <main className="px-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUri(person.displayName, person.color)} alt="" className="h-16 w-16 rounded-full" />
        <div>
          <h1 className="text-2xl font-black">@{person.username}</h1>
          <p className="text-sm text-ink/55">{person.displayName}{person.blueTick ? " · Blue tick" : ""}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/75">{person.bio}</p>
      <p className="mt-3 text-sm text-ink/50">Follows @yagyok{person.username === "yagyok" ? "" : ""} · {person.follows.includes("yagyok") || person.username === "yagyok" ? "founder link is on" : ""}</p>
      {view.canDm && viewer !== person.username && (
        <Link href="/matches" className="btn-ghost mt-4">Message</Link>
      )}
    </main>
  );
}
