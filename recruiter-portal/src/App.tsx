/**
 * Copyright (c) 2026 Uworx UK. All rights reserved.
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
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />

          <Route
            path="/candidate/:id"
            element={
              <ProtectedRoute>
                <CandidateDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruiter"
            element={
              <ProtectedRoute>
                <Recruiter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approval"
            element={
              <ProtectedRoute>
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