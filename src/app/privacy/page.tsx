import { LegalShell } from "@/components/LegalShell";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

export const metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="14 November 2026">
      <p>This policy explains what {APP_NAME} collects, why, and your choices. We aim to comply with the Nigeria Data Protection Act 2023.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account data:</b> your email address and a securely hashed password.</li>
        <li><b>Profile data:</b> display name, date of birth (only your age is shown to others), gender, who you&apos;re interested in, department, level, bio, interests and photos.</li>
        <li><b>Activity:</b> your likes and passes, matches, messages, blocks and reports, and when you were last active.</li>
        <li><b>Technical data:</b> basic logs (such as IP address and browser type) kept by our hosting providers for security.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To confirm you are 18+ and, when you ask for a blue tick, to review the live ID capture and bank receipt you submit.</li>
        <li>To show your profile to other members and suggest people to you.</li>
        <li>To deliver your messages and keep the community safe (reviewing reports, preventing abuse).</li>
      </ul>
      <h2>Who can see what</h2>
      <p>Other members see your display name, age, gender, department, level, bio, interests and photos. They never see your email or exact date of birth. Messages are visible only to you and your match. Administrators may review content connected to a report.</p>
      <h2>Advertising and cookies</h2>
      <p>Outside the Secret Zone, we may use Google AdSense once a publisher ID is configured. The Secret Zone does not load third-party ad scripts. Google and its partners use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising at <a className="underline" href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google Ads Settings</a>. Learn more at <a className="underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">How Google uses information from sites that use its services</a>. We also use essential cookies to keep you signed in.</p>
      <h2>Service providers</h2>
      <p>Your data is stored with Supabase (database, authentication and file storage) and the site is hosted on Vercel. These providers may process data outside Nigeria under appropriate safeguards. We do not sell your personal data.</p>
      <h2>Retention and deletion</h2>
      <p>You can delete your account at any time from your profile page. This permanently deletes your profile, photos, likes, matches and messages. Reports you made about others may be kept for safety purposes.</p>
      <h2>Your rights</h2>
      <p>You can access and correct your data in the app, delete your account, and contact us with any privacy request.</p>
      <h2>Children</h2>
      <p>{APP_NAME} is strictly for adults 18 and over. We remove accounts we believe belong to anyone under 18.</p>
      {CONTACT_EMAIL && (<><h2>Contact</h2><p><a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></>)}
    </LegalShell>
  );
}
