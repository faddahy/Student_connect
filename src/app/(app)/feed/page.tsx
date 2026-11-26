import { FeedView } from "@/components/social/FeedView";
import { ADS, POSTS } from "@/lib/demo/data";
import { isSupabaseConfigured } from "@/lib/config";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const session = await requireUser();
  const viewer = session.persona?.username ?? session.profile?.username ?? "ada";
  const banner = isSupabaseConfigured()
    ? "Signed in with Supabase. The sample feed stays available until your own text posts are in the database."
    : "Demo mode is on because Supabase env vars are not set. Every new account still follows @yagyok.";
  return <FeedView viewer={viewer} posts={POSTS} ads={ADS} banner={banner} />;
}
