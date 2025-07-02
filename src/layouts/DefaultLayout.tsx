import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const DefaultLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <main className="flex-1 p-6 overflow-auto bg-white">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DefaultLayout;
