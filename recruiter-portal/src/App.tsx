/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Results from "./pages/Results";
import CandidateDetails from "./pages/CandidateDetails";
import Login from "./pages/Login";
import Recruiter from "./pages/Recruiter";
import Approval from "./pages/Approval";

type AppShellProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

function AppShell({ darkMode, setDarkMode }: AppShellProps) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {!isLoginPage && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}

      <main className="mx-auto max-w-7xl p-8">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["team_lead"]}>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute allowedRoles={["team_lead"]}>
                <Results />
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidate/:id"
            element={
              <ProtectedRoute allowedRoles={["team_lead"]}>
                <CandidateDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={["team_lead", "hr_admin"]}>
                <Recruiter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approval"
            element={
              <ProtectedRoute allowedRoles={["hr_admin"]}>
                <Approval />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");

    if (saved !== null) {
      return JSON.parse(saved);
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen transition-colors duration-300">
      <BrowserRouter>
        <AppShell darkMode={darkMode} setDarkMode={setDarkMode} />
      </BrowserRouter>
    </div>
  );
}

export default App;