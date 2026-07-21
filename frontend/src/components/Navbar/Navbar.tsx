import { Link } from "react-router-dom";

type NavbarProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

function Navbar({
  darkMode,
  setDarkMode,
}: NavbarProps) {
  return (
    <nav className="border-b border-slate-200 bg-white shadow transition-colors dark:border-slate-700 dark:bg-slate-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <Link
          to="/"
          className="text-xl font-bold transition hover:text-blue-600 dark:hover:text-blue-400"
        >
          ATS Resume Analyzer
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            Home
          </Link>

          <Link
            to="/results"
            className="transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            Results
          </Link>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;