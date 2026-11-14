"use client";
import { useActionState } from "react";
import { updatePassword, type FormState } from "../actions";
import { AuthShell } from "@/components/AuthShell";
import { FormStatus } from "@/components/FormStatus";

export default function ResetPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <AuthShell title="Choose a new password">
      <form action={action} className="space-y-4">
        <input name="password" type="password" minLength={8} required className="input" placeholder="New password" autoComplete="new-password" />
        <FormStatus error={state.error} />
        <button className="btn-primary w-full" disabled={pending}>Save password</button>
      </form>
    </AuthShell>
  );
}
