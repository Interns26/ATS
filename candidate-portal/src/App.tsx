/**
 * Copyright (c) 2026 Coworx UK. All rights reserved.
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JobListings } from "./pages/JobListings";
import { JobDetail } from "./pages/JobDetail";
import { ApplicationForm } from "./pages/ApplicationForm";
import { LoginPage } from "./pages/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobListings />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/apply/:jobId" element={<ApplicationForm />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
