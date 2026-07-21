import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;