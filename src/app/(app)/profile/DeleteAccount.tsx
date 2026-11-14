"use client";
import { deleteAccount } from "./actions";

export function DeleteAccount() {
  return (
    <form action={deleteAccount} onSubmit={(e) => { if (!confirm("Permanently delete your account, photos, matches and messages?")) e.preventDefault(); }}>
      <button className="w-full py-2 text-sm font-semibold text-red-600">Delete my account</button>
    </form>
  );
}
