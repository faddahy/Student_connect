import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import type { MatchRow, Message } from "@/lib/types";
import { ChatRoom } from "./ChatRoom";

export const metadata = { title: "Chat" };

export default async function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const { supabase, user } = await requireUser();
  const { data } = await supabase.rpc("get_matches");
  const match = ((data as MatchRow[]) ?? []).find((m) => m.match_id === matchId);
  if (!match) notFound();
  const { data: msgs } = await supabase
    .from("messages")
    .select("id,match_id,sender,body,created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(100);
  return <ChatRoom match={match} myId={user.id} initial={((msgs as Message[]) ?? []).reverse()} />;
}
