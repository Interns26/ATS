import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Results from "./pages/Results";
import CandidateDetails from "./pages/CandidateDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<MainLayout />}>

          <Route path="/" element={<Home />} />

          <Route path="/results" element={<Results />} />

          <Route
            path="/candidate/:id"
            element={<CandidateDetails />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;