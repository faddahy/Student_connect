import { notFound } from "next/navigation";
import { SecretRoom } from "@/components/secret/SecretRoom";
import { SECRET_CREATORS } from "@/lib/demo/data";

export const metadata = { title: "Creator room", robots: { index: false } };

export default async function CreatorRoom({ params }: { params: Promise<{ creator: string }> }) {
  const { creator } = await params;
  if (!SECRET_CREATORS.some((item) => item.username === creator) && creator !== "mica") notFound();
  return <SecretRoom focus={creator === "mica" ? "mica" : creator} />;
}
