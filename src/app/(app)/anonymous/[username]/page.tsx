import { notFound } from "next/navigation";
import { AnonymousBoard } from "@/components/social/AnonymousBoard";
import { CONFESSIONS, personByUsername } from "@/lib/demo/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Confession inbox" };

export default async function InboxPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const owner = personByUsername(username);
  if (!owner) notFound();
  const session = await requireUser();
  const viewer = session.persona ?? personByUsername("ada")!;
  const notes = CONFESSIONS.filter((note) => note.to === username);
  return <AnonymousBoard viewer={viewer} notes={notes.length ? notes : CONFESSIONS.slice(0, 3)} inbox={username} />;
}
