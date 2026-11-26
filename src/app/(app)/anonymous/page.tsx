import { AnonymousBoard } from "@/components/social/AnonymousBoard";
import { CONFESSIONS } from "@/lib/demo/data";
import { requireUser } from "@/lib/session";
import { personByUsername } from "@/lib/demo/data";

export const metadata = { title: "Anonymous" };

export default async function AnonymousPage() {
  const session = await requireUser();
  const viewer = session.persona ?? personByUsername("ada")!;
  const inbox = viewer.username;
  return <AnonymousBoard viewer={viewer} notes={CONFESSIONS.filter((note) => note.public)} inbox={inbox} />;
}
