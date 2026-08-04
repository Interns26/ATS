/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
 */

type LoadingOverlayProps = {
  message?: string;
  subMessage?: string;
};

function LoadingOverlay({
  message = "Loading...",
  subMessage,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center app-overlay backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl px-10 py-8 app-card">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4"
          style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'var(--primary)' }}
        />

        <p className="text-lg font-semibold">{message}</p>

        {subMessage && (
          <p className="max-w-xs text-center text-sm muted">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoadingOverlay;