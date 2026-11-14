"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signIn, type FormState } from "../actions";
import { FormStatus } from "@/components/FormStatus";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {notice && <FormStatus error={notice} />}
      <div>
        <label className="label" htmlFor="email">Student email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <FormStatus error={state.error} />
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Logging in…" : "Log in"}</button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-ink/60 underline">Forgot password?</Link>
        <Link href="/signup" className="font-semibold text-brand-600">Create account</Link>
      </div>
    </form>
  );
}
