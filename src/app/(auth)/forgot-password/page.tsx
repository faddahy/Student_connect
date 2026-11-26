"use client";
import { useActionState } from "react";
import { requestPasswordReset, type FormState } from "../actions";
import { AuthShell } from "@/components/AuthShell";
import { FormStatus } from "@/components/FormStatus";

export default function ForgotPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <AuthShell title="Reset password" subtitle="We'll email you a reset link.">
      <form action={action} className="space-y-4">
        <input name="email" type="email" required className="input" placeholder="you@gmail.com" />
        <FormStatus error={state.error} message={state.message} />
        <button className="btn-primary w-full" disabled={pending}>Send reset link</button>
      </form>
    </AuthShell>
  );
}
