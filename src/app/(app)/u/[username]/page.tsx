import Link from "next/link";
import { notFound } from "next/navigation";
import { isBlocked, personByUsername, sharesGroup } from "@/lib/demo/data";
import { blockView } from "@/lib/engine";
import { requireUser } from "@/lib/session";
import { ProfileView } from "@/components/social/ProfileView";

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

  return <ProfileView person={person} viewer={viewer} self={viewer === person.username} />;
}
