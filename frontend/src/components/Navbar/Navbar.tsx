import { Link, useNavigate } from "react-router-dom";

import { clearToken } from "../../lib/auth";

type NavbarProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

function Navbar({
  darkMode,
  setDarkMode,
}: NavbarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <nav className={`app-navbar`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold transition brand">
            ATS Resume Analyzer
          </Link>
        </div>

        <div className="flex items-center nav-links">
          <Link to="/" className="transition">
            Home
          </Link>

          <Link to="/results" className="transition">
            Results
          </Link>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-lg px-4 py-2 transition app-btn"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 transition app-btn"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;