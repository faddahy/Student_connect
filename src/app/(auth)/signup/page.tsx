"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signUp, type FormState } from "../actions";
import { AuthShell } from "@/components/AuthShell";
import { FormStatus } from "@/components/FormStatus";
export default function SignUpPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});
  return (
    <AuthShell title="Create your account" subtitle="Any Gmail or email. 18+ only. New members follow @yagyok automatically.">
      {state.message ? (
        <FormStatus message={state.message} />
      ) : (
        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input"
              placeholder="you@gmail.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="At least 8 characters" />
          </div>
          <label className="flex items-start gap-3 text-sm text-ink/70">
            <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 accent-brand-500" />
            <span>
              I am 18 or older and I agree to the <Link className="underline" href="/terms">Terms</Link>,{" "}
              <Link className="underline" href="/privacy">Privacy Policy</Link> and{" "}
              <Link className="underline" href="/guidelines">Community Guidelines</Link>.
            </span>
          </label>
          <FormStatus error={state.error} />
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Creating…" : "Sign up"}</button>
          <p className="text-center text-sm text-ink/60">
            Already have an account? <Link href="/login" className="font-semibold text-brand-600">Log in</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
