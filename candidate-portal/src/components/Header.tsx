/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useState, useEffect } from "react";
import { Briefcase, LogIn, LogOut, User, UserPlus, LayoutDashboard } from "lucide-react";
import { LoginModal } from "./LoginModal";
import { RegisterModal } from "./RegisterModal";
import { getToken, clearToken } from "../lib/auth";
import { fetchCurrentUser } from "../services/api";
import type { CandidateProfile } from "../services/api";

export function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState<CandidateProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchCurrentUser(token)
        .then((userData) => setUser(userData))
        .catch(() => clearToken())
        .finally(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-white shadow-sm">
              <Briefcase size={18} />
            </div>
            <span
              className="text-lg font-bold text-primary-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Careers
            </span>
          </a>

          {!checkingAuth && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-xs font-semibold text-primary-800 shadow-xs">
                    <User size={14} className="text-primary-700" />
                    <span>{user.username}</span>
                    {user.role === "candidate" && (
                      <span className="rounded-md bg-accent-100 px-1.5 py-0.5 text-[10px] uppercase font-bold text-accent-700">
                        Candidate
                      </span>
                    )}
                  </div>

                  {user.role === "admin" && (
                    <a
                      href="http://localhost:5173"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-primary-800 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-900 shadow-sm"
                    >
                      <LayoutDashboard size={14} />
                      Recruiter Dashboard
                    </a>
                  )}

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-accent-200 bg-accent-50 px-3.5 py-2 text-sm font-semibold text-accent-700 transition hover:bg-accent-100 hover:border-accent-300"
                  >
                    <UserPlus size={16} />
                    Register
                  </button>

                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-primary-700 hover:text-primary-800 hover:bg-primary-50/50"
                  >
                    <LogIn size={16} />
                    Login
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(profile) => {
          console.log("[Header] LoginModal onSuccess profile received:", profile);
          setUser(profile);
          setIsLoginOpen(false);
        }}
        onSwitchToRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(profile) => {
          console.log("[Header] RegisterModal onSuccess profile received:", profile);
          setUser(profile);
          setIsRegisterOpen(false);
        }}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
}

