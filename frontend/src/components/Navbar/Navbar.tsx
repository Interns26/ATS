import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-slate-900 shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        <div>
          <h1 className="text-xl font-bold text-white">
            ATS Resume Analyzer
          </h1>
        </div>

        <div className="flex gap-8">

          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-blue-400"
                : "text-gray-300 hover:text-white"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/results"
            className={({ isActive }) =>
              isActive
                ? "font-semibold text-blue-400"
                : "text-gray-300 hover:text-white"
            }
          >
            Results
          </NavLink>

        </div>

      </div>
    </nav>
  );
}

export default Navbar;