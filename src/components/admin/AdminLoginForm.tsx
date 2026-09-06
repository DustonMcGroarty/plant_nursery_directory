"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16 sm:px-6">
      <h1 className="text-xl font-bold">Admin Login</h1>
      {state.error && <p className="mt-2 text-sm text-accent">{state.error}</p>}
      <form action={formAction} className="mt-4 space-y-3">
        <input
          type="password"
          name="secret"
          placeholder="Admin secret"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
