/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { Link, useNavigate } from "react-router-dom";
import { clearToken, getUser } from "../../lib/auth";

type NavbarProps = {
  darkMode?: boolean;
  setDarkMode?: React.Dispatch<React.SetStateAction<boolean>>;
};

function Navbar({
  darkMode = false,
  setDarkMode = () => {},
}: NavbarProps) {
  const navigate = useNavigate();
  const user = getUser();
  const isHrAdmin = user?.role === "hr_admin";

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <nav className={`app-navbar`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="flex items-center">
          <Link to={isHrAdmin ? "/approval" : "/"} className="text-xl font-bold transition brand">
            ATS Resume Analyzer
          </Link>
        </div>

        <div className="flex items-center gap-3 nav-links">
          {isHrAdmin ? (
            <>
              <Link to="/approval" className="transition">
                Approval
              </Link>
              <Link to="/recruiter" className="transition">
                Recruiter
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="transition">
                Home
              </Link>
              <Link to="/recruiter" className="transition">
                Recruiter
              </Link>
              <Link to="/results" className="transition">
                Results
              </Link>
            </>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-lg px-3 py-1.5 transition app-btn text-sm"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {isHrAdmin ? "HR Admin" : "Team Lead"}
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.name}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 transition app-btn text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;