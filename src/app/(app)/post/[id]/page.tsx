import { PostDetail } from "@/components/social/PostDetail";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Post" };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  const viewer = session.persona?.username ?? session.profile?.username ?? "ada";
  return <PostDetail id={id} viewer={viewer} />;
}
