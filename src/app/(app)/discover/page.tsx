import { DatingDeck } from "@/components/social/DatingDeck";
import { DiscoverDeck } from "./DiscoverDeck";
import { PEOPLE, isBlocked } from "@/lib/demo/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Dating" };

export default async function DiscoverPage() {
  const session = await requireUser();
  if (session.demo && session.persona) {
    const viewer = session.persona;
    const candidates = PEOPLE.filter(
      (person) =>
        person.username !== viewer.username &&
        person.username !== "yagyok" &&
        person.username !== "zara" &&
        !isBlocked(viewer.username, person.username),
    );
    return <DatingDeck viewer={viewer} candidates={candidates} />;
  }
  return <DiscoverDeck myId={session.user.id} />;
}
