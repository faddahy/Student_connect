import { notFound } from "next/navigation";
import { SecretRoom } from "@/components/secret/SecretRoom";
import { SECRET_CREATORS } from "@/lib/demo/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Creator room", robots: { index: false } };

export default async function CreatorRoom({ params }: { params: Promise<{ creator: string }> }) {
  const { creator } = await params;
  if (!SECRET_CREATORS.some((item) => item.username === creator) && creator !== "mica") notFound();
  const session = await requireUser();
  const blueTick = session.demo ? Boolean(session.persona?.blueTick) : Boolean(session.profile?.blue_tick);
  const username = session.persona?.username ?? session.profile?.username ?? "you";
  return <SecretRoom focus={creator === "mica" ? "mica" : creator} blueTick={blueTick} username={username} />;
}
