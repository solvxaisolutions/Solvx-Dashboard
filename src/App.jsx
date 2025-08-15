// src/App.jsx
import React from "react";
import Header from "./components/Header";

export default function App({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
