import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar/Navbar";

import Home from "./pages/Home";
import Results from "./pages/Results";
import CandidateDetails from "./pages/CandidateDetails";

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
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100">
      <BrowserRouter>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main className="mx-auto max-w-7xl p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results" element={<Results />} />
            <Route path="/candidate/:id" element={<CandidateDetails />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;