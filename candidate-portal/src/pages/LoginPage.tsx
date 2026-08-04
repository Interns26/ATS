/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, KeyRound, AlertCircle, ArrowRight } from "lucide-react";
import { Header } from "../components/Header";
import { login } from "../services/api";
import { setToken } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await login(username, password);
      setToken(data.access_token);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log in. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100 shadow-sm">
              <KeyRound size={24} />
            </div>
            <h1
              className="text-2xl font-bold text-ink-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recruiter Login
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Sign in to access recruiter features and manage applications.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Username
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoFocus
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-800 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-900 disabled:opacity-50"
              >
                {submitting ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-lg border border-ink-100 bg-ink-50 p-3 text-center text-xs text-ink-500">
            Default credentials: <span className="font-semibold text-ink-700">admin</span> /{" "}
            <span className="font-semibold text-ink-700">admin</span>
          </div>

        </div>
      </div>
    </div>
  );
}
