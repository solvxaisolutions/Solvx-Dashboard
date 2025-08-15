// src/pages/Dashboard.jsx
import React from "react";
import SubmissionTable from "../components/SubmissionTable";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Submissions</h1>
      <SubmissionTable />
    </div>
  );
}
