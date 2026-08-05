/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button/Button";
import Card from "../components/Card/Card";
import Input from "../components/Input/Input";

import { login } from "../services/api";
import { setToken } from "../lib/auth";

function Login() {
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
      setToken(data.access_token, data.user ?? { username, name: username, role: data.role });
      const targetPath = (data.user?.role === "hr_admin" || data.role === "hr_admin") ? "/approval" : "/";
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <Card title="Sign in to ATS">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block font-medium" htmlFor="username">
                Username
              </label>

              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sarah or admin"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2 block font-medium" htmlFor="password">
                Password
              </label>

              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </Card>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-600 dark:text-slate-400">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Available Portal Logins:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">Team Lead (Recruiter)</span>
              <p>Username: <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">sarah</code></p>
              <p>Password: <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">password123</code></p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">HR Admin</span>
              <p>Username: <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">admin</code></p>
              <p>Password: <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">admin123</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;