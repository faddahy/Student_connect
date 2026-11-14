import { LegalShell } from "@/components/LegalShell";
import { APP_NAME } from "@/lib/config";

export const metadata = { title: "Community Guidelines" };

export default function Guidelines() {
  return (
    <LegalShell title="Community Guidelines" updated="14 November 2026">
      <p>{APP_NAME} works because members treat each other with respect. Breaking these rules can get your account suspended or permanently banned.</p>
      <h2>Be real</h2>
      <ul>
        <li>Use your own recent photos. No celebrities, cartoons or other people.</li>
        <li>You must be 18 or older and a current FUT Minna student.</li>
        <li>One account per person. Don&apos;t impersonate anyone.</li>
      </ul>
      <h2>Be respectful</h2>
      <ul>
        <li>No harassment, bullying, threats, hate speech or discrimination based on tribe, religion, gender, disability or anything else.</li>
        <li>No sending sexual content to people who haven&apos;t asked for it. No nudity in profile photos.</li>
        <li>&ldquo;No&rdquo; means no. If someone unmatches or blocks you, don&apos;t try to contact them another way.</li>
      </ul>
      <h2>No scams or selling</h2>
      <ul>
        <li>Never ask for money, airtime, gifts, bank details or account passwords.</li>
        <li>No advertising, recruiting, MLM, betting promotions or escort services.</li>
      </ul>
      <h2>Stay safe</h2>
      <ul>
        <li>Get to know people in the app before sharing your phone number or socials.</li>
        <li>Meet for the first time in a busy public place on campus and tell a friend where you&apos;re going.</li>
        <li>Never send money to someone you met online.</li>
        <li>If you feel unsafe, leave and contact campus security or the police (Nigeria emergency: 112).</li>
      </ul>
      <h2>Reporting</h2>
      <p>Use the ⋯ button on any profile or chat to report or block someone. Reports are confidential and reviewed by the {APP_NAME} team.</p>
    </LegalShell>
  );
}
