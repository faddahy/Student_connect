import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Log in with your FUT Minna student email.">
      <LoginForm next={sp.next || "/discover"} notice={sp.error ? "That link is invalid or has expired. Please log in or request a new one." : undefined} />
    </AuthShell>
  );
}
