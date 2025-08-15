// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      nav("/", { replace: true });
    }
  }, [nav]);

  function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPassword) {
      localStorage.setItem("isLoggedIn", "true");
      nav("/", { replace: true });
    } else {
      setErr("Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-violet-500">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Admin Sign in</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full px-3 py-2 border rounded"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full px-3 py-2 border rounded"
          />
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <button
            type="submit"
            className="w-full py-2 rounded bg-gray-800 text-white hover:bg-gray-900"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
