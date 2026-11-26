import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, personByUsername } from "@/lib/demo/data";

export const metadata = { title: "Post" };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = POSTS.find((item) => item.id === id);
  if (!post) notFound();
  const author = personByUsername(post.author);
  return (
    <main className="px-4">
      <p className="text-sm text-ink/50">@{author?.username} · {post.kind}</p>
      <p className="mt-3 text-lg leading-relaxed">{post.body || "Distributed post. Open the original to interact."}</p>
      {post.originalId && <Link href={`/post/${post.originalId}`} className="mt-4 inline-block font-semibold text-brand-200">Original post</Link>}
      <Link href="/feed" className="btn-ghost mt-6">Back to feed</Link>
    </main>
  );
}
