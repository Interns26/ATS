import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JobListings } from "./pages/JobListings";
import { JobDetail } from "./pages/JobDetail";
import { ApplicationForm } from "./pages/ApplicationForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobListings />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/apply/:jobId" element={<ApplicationForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
