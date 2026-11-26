import { LegalShell } from "@/components/LegalShell";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

export const metadata = { title: "About" };

export default function About() {
  return (
    <LegalShell title={`About ${APP_NAME}`}>
      <p>{APP_NAME} is a text-first social app. Anyone with an email can join. The main feed stays in words so the product can run on the free Vercel and Supabase tiers. Dating, games, anonymous notes, and an 18+ creator room live in their own sections.</p>
      <h2>Why any email?</h2>
      <p>Sign-up is open. A live camera check and a manual bank transfer are what unlock the blue tick, not a campus inbox.</p>
      <h2>How it stays free to host</h2>
      <p>Video is kept out of the main feed. Ads, when a publisher ID is set, never run inside the Secret Zone. House ads from mimic advertiser accounts are the default.</p>
      <h2>Founder</h2>
      <p>New accounts follow @yagyok automatically. That account reviews bank receipts and ad performance.</p>
      {CONTACT_EMAIL && (<><h2>Contact</h2><p>Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p></>)}
    </LegalShell>
  );
}
