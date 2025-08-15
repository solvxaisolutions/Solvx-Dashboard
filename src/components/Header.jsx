// src/components/Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const nav = useNavigate();

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    nav("/login", { replace: true });
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-semibold">Admin Dashboard</div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
