"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-16 sm:px-6">
      <div className="rounded-[20px] bg-surface p-6 shadow-[0_2px_8px_rgba(10,20,18,0.04),0_16px_40px_rgba(10,20,18,0.06)]">
        <h1 className="text-lg font-extrabold tracking-tight text-foreground">Admin Login</h1>
        {state.error && <p className="mt-2 text-sm font-medium text-accent">{state.error}</p>}
        <form action={formAction} className="mt-4 space-y-3">
          <input
            type="password"
            name="secret"
            placeholder="Admin secret"
            className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-contrast hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
