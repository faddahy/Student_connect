import { DiscoverDeck } from "./DiscoverDeck";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const { user } = await requireUser();
  return <DiscoverDeck myId={user.id} />;
}
