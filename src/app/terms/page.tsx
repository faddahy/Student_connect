import { LegalShell } from "@/components/LegalShell";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/config";

export const metadata = { title: "Terms of Use" };

export default function Terms() {
  return (
    <LegalShell title="Terms of Use" updated="14 November 2026">
      <p>These Terms govern your use of {APP_NAME} (the &ldquo;Service&rdquo;). By creating an account you agree to them. If you don&apos;t agree, don&apos;t use the Service.</p>
      <h2>1. Eligibility</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>You must be 18 or older and sign up with an email address you control. Any provider, including Gmail, is accepted.</li>
        <li>You must not have been previously banned from the Service.</li>
      </ul>
      <h2>2. Your account</h2>
      <p>You are responsible for keeping your password safe and for all activity on your account. The information you provide, including your date of birth, must be accurate.</p>
      <h2>3. Your content</h2>
      <p>You own the photos and text you post. You give {APP_NAME} a limited licence to store and display that content to other members in order to run the Service. You must have the right to post everything you upload.</p>
      <h2>4. Conduct</h2>
      <p>You agree to follow our Community Guidelines. You must not use the Service for anything illegal, to harass anyone, to send spam, to solicit money, or to collect other members&apos; data.</p>
      <h2>5. Safety disclaimer</h2>
      <p>{APP_NAME} does not run criminal background checks and cannot guarantee the identity or intentions of members. You are solely responsible for your interactions with other members, online and offline. Please follow the safety tips in our Community Guidelines.</p>
      <h2>6. Advertising</h2>
      <p>The Service is free and supported by third-party advertising, including Google AdSense. There are no paid features and no payments between members and {APP_NAME}.</p>
      <h2>7. Moderation and termination</h2>
      <p>We may remove content, suspend or ban accounts that break these Terms or the Community Guidelines, at our discretion. You may delete your account at any time from your profile page.</p>
      <h2>8. No warranty and limitation of liability</h2>
      <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by law, {APP_NAME} is not liable for any indirect or consequential loss, or for the conduct of any member.</p>
      <h2>9. Independence</h2>
      <p>{APP_NAME} is an independent product. It is not affiliated with any university.</p>
      <h2>10. Changes and governing law</h2>
      <p>We may update these Terms and will post the new version here. These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
      {CONTACT_EMAIL && (<><h2>Contact</h2><p><a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></>)}
    </LegalShell>
  );
}
