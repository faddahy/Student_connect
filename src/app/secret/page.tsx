import { SecretRoom } from "@/components/secret/SecretRoom";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Secret Zone", robots: { index: false } };

export default async function SecretPage() {
  const session = await requireUser();
  const blueTick = session.demo ? Boolean(session.persona?.blueTick) : Boolean(session.profile?.blue_tick);
  const username = session.persona?.username ?? session.profile?.username ?? "you";
  return <SecretRoom blueTick={blueTick} username={username} />;
}
