import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { avatarUri, personByUsername } from "@/lib/demo/data";
import type { MatchRow, Message } from "@/lib/types";
import { ChatRoom } from "./ChatRoom";

export const metadata = { title: "Chat" };

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const session = await requireUser();
  if (session.demo) {
    const chika = personByUsername("chika")!;
    if (matchId !== "demo-chika") notFound();
    const match: MatchRow = {
      match_id: "demo-chika",
      matched_at: new Date().toISOString(),
      user_id: chika.id,
      display_name: chika.displayName,
      age: chika.age,
      department: chika.department,
      level: chika.level,
      bio: chika.bio,
      interests: chika.interests,
      photos: [avatarUri(chika.displayName, chika.color)],
      last_message: null,
      last_message_at: null,
      last_sender: null,
    };
    const initial: Message[] = [{
      id: "m1",
      match_id: match.match_id,
      sender: chika.id,
      body: "The ₦100 is only a hold until we both confirm.",
      created_at: new Date().toISOString(),
    }];
    return <ChatRoom match={match} myId={session.user.id} initial={initial} demo />;
  }
  const supabase = session.supabase;
  if (!supabase) notFound();
  const { data } = await supabase.rpc("get_matches");
  const match = ((data as MatchRow[]) ?? []).find((m) => m.match_id === matchId);
  if (!match) notFound();
  const { data: msgs } = await supabase
    .from("messages")
    .select("id,match_id,sender,body,created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(100);
  return <ChatRoom match={match} myId={session.user.id} initial={((msgs as Message[]) ?? []).reverse()} />;
}
