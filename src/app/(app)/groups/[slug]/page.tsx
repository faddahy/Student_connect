import Link from "next/link";
import { notFound } from "next/navigation";
import { GROUPS, POSTS, isBlocked, personByUsername } from "@/lib/demo/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Group" };

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const group = GROUPS.find((item) => item.slug === slug);
  if (!group) notFound();
  const session = await requireUser();
  const viewer = session.persona?.username ?? "ada";
  const posts = POSTS.filter((post) => post.groupSlug === slug);

  return (
    <main className="px-4">
      <h1 className="text-2xl font-extrabold">{group.name}</h1>
      <p className="mt-1 text-sm text-ink/60">{group.about}</p>
      <p className="mt-2 text-xs text-ink/40">{group.members.map((name) => `@${name}`).join(" · ")}</p>
      <div className="mt-4 space-y-3">
        {posts.map((post) => {
          const author = personByUsername(post.author);
          const blocked = isBlocked(viewer, post.author);
          return (
            <article key={post.id} className="card">
              {blocked && (
                <p className="mb-2 text-xs text-amber-100">Blocked profile. This public group post is still visible, and DMs stay closed.</p>
              )}
              <p className="text-sm font-bold">@{author?.username}</p>
              <p className="mt-2 text-sm leading-relaxed">{post.body}</p>
            </article>
          );
        })}
      </div>
      <Link href="/feed" className="btn-ghost mt-4">Back to feed</Link>
    </main>
  );
}
