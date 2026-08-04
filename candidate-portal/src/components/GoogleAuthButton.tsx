/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useEffect, useRef, useState } from "react";
import { googleLogin } from "../services/api";
import type { CandidateProfile } from "../services/api";
import { setToken } from "../lib/auth";

interface GoogleAuthButtonProps {
  onSuccess: (profile: CandidateProfile) => void;
  onError: (error: string) => void;
  label?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleAuthButton({ onSuccess, onError, label = "Continue with Google" }: GoogleAuthButtonProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(false);

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!googleClientId) return;

    const handleGoogleResponse = async (response: { credential: string }) => {
      console.log("[GoogleAuth] Google GIS credential token received:", response.credential ? "Present" : "Missing");
      setLoading(true);
      try {
        const data = await googleLogin(response.credential);
        console.log("[GoogleAuth] Backend response received:", data);

        if (data.access_token) {
          setToken(data.access_token);
        }

        const fullName = `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim();
        const profile: CandidateProfile = {
          username: data.user?.username || fullName || "Google Candidate",
          role: "candidate",

          email: data.user?.email,
          first_name: data.user?.first_name,
          last_name: data.user?.last_name,
          city: data.user?.city,
          state_province: data.user?.state_province,
          mobile_number: data.user?.mobile_number,
          candidate_id: data.user?.candidate_id,
        };

        console.log("[GoogleAuth] Calling onSuccess callback with profile:", profile);
        onSuccessRef.current(profile);
      } catch (err) {
        console.error("[GoogleAuth] Error during Google auth flow:", err);
        onErrorRef.current(err instanceof Error ? err.message : "Google authentication failed.");
      } finally {
        setLoading(false);
      }
    };

    const setupGoogleSDK = () => {
      if (!window.google?.accounts?.id || !btnRef.current) return;

      if (!initializedRef.current) {
        initializedRef.current = true;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
        });
      }

      try {
        btnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      } catch (err) {
        console.error("[GoogleAuth] Failed to render Google button:", err);
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleSDK();
    } else {
      const existingScript = document.getElementById("google-gsi-script");
      if (existingScript) {
        existingScript.addEventListener("load", setupGoogleSDK);
      } else {
        const script = document.createElement("script");
        script.id = "google-gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = setupGoogleSDK;
        document.head.appendChild(script);
      }
    }
  }, [googleClientId]);

  const handleDemoGoogleAuth = () => {
    if (!googleClientId) {
      onErrorRef.current("Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in candidate-portal/.env file.");
    }
  };

  if (!googleClientId) {
    return (
      <button
        type="button"
        onClick={handleDemoGoogleAuth}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white py-2.5 px-4 text-sm font-semibold text-ink-700 shadow-xs transition hover:bg-ink-50 hover:border-ink-300"
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className="w-full flex justify-center">
      {loading ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-xs text-ink-500">
          Authenticating with Google...
        </div>
      ) : (
        <div ref={btnRef} className="w-full flex justify-center min-h-[44px]" />
      )}
    </div>
  );
}
