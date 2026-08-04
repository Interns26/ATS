/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { X, Lock, Mail, User, Phone, MapPin, UserPlus, AlertCircle, ArrowRight } from "lucide-react";
import { registerCandidate } from "../services/api";
import type { CandidateProfile } from "../services/api";
import { setToken } from "../lib/auth";
import { GoogleAuthButton } from "./GoogleAuthButton";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: CandidateProfile) => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSuccess, onSwitchToLogin }: RegisterModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      setError("Please fill in all required fields (Name, Email, Password).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await registerCandidate({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber: mobileNumber.trim() || undefined,
        city: city.trim() || undefined,
        stateProvince: stateProvince.trim() || undefined,
      });

      setToken(data.access_token);
      onSuccess({
        username: `${firstName.trim()} ${lastName.trim()}`,
        role: "candidate",
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        city: city.trim() || undefined,
        state_province: stateProvince.trim() || undefined,
        mobile_number: mobileNumber.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 shadow-2xl transition-all sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 border border-accent-100 shadow-sm">
            <UserPlus size={24} />
          </div>
          <h3
            className="text-2xl font-bold text-ink-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Candidate Registration
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            Create an account to apply faster and track your job applications.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Quick Sign-Up */}
        <div className="mb-5 space-y-3">
          <GoogleAuthButton
            onSuccess={(profile) => {
              onSuccess(profile);
              onClose();
            }}
            onError={(err) => setError(err)}
            label="Register with Google"
          />

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-ink-200" />
            <span className="absolute bg-white px-2 text-[11px] uppercase tracking-wider text-ink-400 font-semibold">
              or register with details
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="w-full rounded-xl border border-ink-200 bg-white py-2.5 px-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Email Address <span className="text-red-500">*</span>
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
                placeholder="john.doe@example.com"
                required
                className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Password <span className="text-red-500">*</span>
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
                  placeholder="Min 6 characters"
                  required
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full rounded-xl border border-ink-200 bg-white py-2.5 px-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Phone
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+1 555-0199"
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                City
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                State / Prov
              </label>
              <input
                type="text"
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                placeholder="NY"
                className="w-full rounded-xl border border-ink-200 bg-white py-2.5 px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-700 disabled:opacity-50"
            >
              {submitting ? (
                "Creating Account..."
              ) : (
                <>
                  Register & Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Toggle */}
        <div className="mt-5 text-center text-xs text-ink-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToLogin();
            }}
            className="font-semibold text-primary-700 underline hover:text-primary-900"
          >
            Log In here
          </button>
        </div>
      </div>
    </div>
  );
}
