import { Briefcase, LogIn } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-800 text-white">
            <Briefcase size={18} />
          </div>
          <span
            className="text-lg font-bold text-primary-900"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Careers
          </span>
        </a>

        <button className="flex items-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-primary-700 hover:text-primary-800">
          <LogIn size={16} />
          Login
        </button>
      </div>
    </header>
  );
}
