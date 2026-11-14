import { LegalShell } from "@/components/LegalShell";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

export const metadata = { title: "About" };

export default function About() {
  return (
    <LegalShell title={`About ${APP_NAME}`}>
      <p>{APP_NAME} is a free dating and friendship web app for students of the Federal University of Technology, Minna (FUT Minna), Niger State, Nigeria. It was built by a fellow student to give FUT Minna students a safer, verified place to meet each other.</p>
      <h2>Why student emails?</h2>
      <p>Requiring a university-issued student email keeps the community to real FUT Minna students and cuts down on fake profiles and scammers.</p>
      <h2>How is it free?</h2>
      <p>{APP_NAME} is supported by advertising (Google AdSense). You never pay to use it, and we never sell your personal data.</p>
      <h2>Independence</h2>
      <p>{APP_NAME} is an independent project and is not owned, operated or endorsed by FUT Minna.</p>
      {CONTACT_EMAIL && (<><h2>Contact</h2><p>Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p></>)}
    </LegalShell>
  );
}
