/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { X, Lock, User, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { login, candidateLogin } from "../services/api";
import type { CandidateProfile } from "../services/api";
import { setToken } from "../lib/auth";
import { GoogleAuthButton } from "./GoogleAuthButton";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: CandidateProfile) => void;
  onSwitchToRegister?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister }: LoginModalProps) {
  const [tab, setTab] = useState<"candidate" | "recruiter">("candidate");

  // Candidate state
  const [email, setEmail] = useState("");
  const [candPassword, setCandPassword] = useState("");

  // Recruiter state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCandidateSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !candPassword) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await candidateLogin(email.trim(), candPassword);
      setToken(data.access_token);
      onSuccess({
        username: data.user?.username ?? email,
        role: "candidate",
        email: data.user?.email ?? email,
        first_name: data.user?.first_name,
        last_name: data.user?.last_name,
        city: data.user?.city,
        state_province: data.user?.state_province,
        mobile_number: data.user?.mobile_number,
        candidate_id: data.user?.candidate_id,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid candidate credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecruiterSubmit(e: FormEvent) {
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
      onSuccess({
        username: username,
        role: "admin",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl transition-all sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100 shadow-sm">
            <KeyRound size={24} />
          </div>
          <h3
            className="text-2xl font-bold text-ink-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome Back
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            Sign in to your candidate account or recruiter portal
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex rounded-xl bg-ink-100 p-1">
          <button
            type="button"
            onClick={() => {
              setTab("candidate");
              setError(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              tab === "candidate"
                ? "bg-white text-primary-900 shadow-sm"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <UserCheck size={16} /> Candidate Login
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("recruiter");
              setError(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
              tab === "recruiter"
                ? "bg-white text-primary-900 shadow-sm"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <ShieldCheck size={16} /> Recruiter Login
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {tab === "candidate" ? (
          /* Candidate Login Form */
          <div className="space-y-4">
            <GoogleAuthButton
              onSuccess={(profile) => {
                onSuccess(profile);
                onClose();
              }}
              onError={(err) => setError(err)}
              label="Sign in with Google"
            />

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-ink-200" />
              <span className="absolute bg-white px-2 text-[11px] uppercase tracking-wider text-ink-400 font-semibold">
                or email
              </span>
            </div>

            <form onSubmit={handleCandidateSubmit} className="space-y-4">

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  autoFocus
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
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
                  value={candPassword}
                  onChange={(e) => setCandPassword(e.target.value)}
                  placeholder="Enter candidate password"
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
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
                    Sign In as Candidate <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {onSwitchToRegister && (
              <div className="mt-4 text-center text-xs text-ink-500">
                Don't have a candidate account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToRegister();
                  }}
                  className="font-semibold text-accent-600 underline hover:text-accent-700"
                >
                  Register here
                </button>
              </div>
            )}
          </form>
          </div>
        ) : (
          /* Recruiter Login Form */
          <form onSubmit={handleRecruiterSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Admin Username
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoFocus
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
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
                    Sign In as Recruiter <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50 p-2.5 text-center text-xs text-ink-500">
              Recruiter Admin: <span className="font-semibold text-ink-700">admin</span> /{" "}
              <span className="font-semibold text-ink-700">admin</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
