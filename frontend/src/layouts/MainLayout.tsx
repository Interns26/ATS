import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="w-full px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;