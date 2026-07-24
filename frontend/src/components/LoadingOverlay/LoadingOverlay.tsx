type LoadingOverlayProps = {
  message?: string;
  subMessage?: string;
};

function LoadingOverlay({
  message = "Loading...",
  subMessage,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white px-10 py-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-500" />

        <p className="text-lg font-semibold dark:text-white">{message}</p>

        {subMessage && (
          <p className="max-w-xs text-center text-sm text-slate-500 dark:text-slate-400">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoadingOverlay;