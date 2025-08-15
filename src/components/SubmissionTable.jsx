// src/components/SubmissionTable.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import { exportToCsv } from "../utils/csv";
import { format } from "date-fns";

const PAGE_SIZE = 8;

function humanDate(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, "yyyy-MM-dd HH:mm");
  } catch {
    return "";
  }
}

export default function SubmissionTable() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderField, setOrderField] = useState("createdAt");
  const [orderDir, setOrderDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [latestOnly, setLatestOnly] = useState(false);

  const [page, setPage] = useState(0);
  const cursorsRef = useRef([]); // last doc of each page
  const [hasNextPage, setHasNextPage] = useState(false);

  const buildQuery = (startDoc) => {
    let q = query(
      collection(db, "submissions"),
      orderBy(orderField, orderDir),
      limit(PAGE_SIZE + 1) // fetch one extra to check if more pages exist
    );

    if (latestOnly) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      q = query(
        collection(db, "submissions"),
        where("createdAt", ">=", since),
        orderBy(orderField, orderDir),
        limit(PAGE_SIZE + 1)
      );
    }

    if (startDoc) {
      q = query(q, startAfter(startDoc));
    }

    return q;
  };

  const loadPage = async (pageIndex) => {
    setLoading(true);
    const startDoc = pageIndex > 0 ? cursorsRef.current[pageIndex - 1] : null;

    const snap = await getDocs(buildQuery(startDoc));
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Store the last doc of this page for next page usage
    if (items.length > PAGE_SIZE) {
      cursorsRef.current[pageIndex] = snap.docs[PAGE_SIZE - 1];
      setHasNextPage(true);
    } else {
      setHasNextPage(false);
    }

    // Only keep PAGE_SIZE items for display
    setDocs(items.slice(0, PAGE_SIZE));
    setLoading(false);
  };

  useEffect(() => {
    cursorsRef.current = [];
    setPage(0);
    loadPage(0);
  }, [orderField, orderDir, latestOnly]);

  const filtered = docs.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.message && d.message.toLowerCase().includes(q))
    );
  });

  async function toggleRead(id, current) {
    try {
      await updateDoc(doc(db, "submissions", id), { read: !current });
    } catch (err) {
      console.error(err);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this submission? This is permanent.")) return;
    try {
      await deleteDoc(doc(db, "submissions", id));
      loadPage(page); // reload current page after deletion
    } catch (err) {
      console.error(err);
    }
  }

  function handleExport() {
    const rows = filtered.map((r) => ({
      id: r.id,
      name: r.name || "",
      email: r.email || "",
      message: r.message || "",
      date: humanDate(r.createdAt || r.timestamp),
      read: Boolean(r.read)
    }));
    exportToCsv("submissions.csv", rows);
  }

  const goNextPage = () => {
    if (!hasNextPage) return;
    const newPage = page + 1;
    setPage(newPage);
    loadPage(newPage);
  };

  const goPrevPage = () => {
    if (page === 0) return;
    const newPage = page - 1;
    setPage(newPage);
    loadPage(newPage);
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-col md:flex-row">
        <div className="flex gap-2 items-center">
          <input
            placeholder="Search name / email / message"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded w-64"
          />
          <select
            value={orderField}
            onChange={(e) => setOrderField(e.target.value)}
            className="px-2 py-2 border rounded"
          >
            <option value="createdAt">Date</option>
            <option value="timestamp">Timestamp</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          <select
            value={orderDir}
            onChange={(e) => setOrderDir(e.target.value)}
            className="px-2 py-2 border rounded"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <label className="flex items-center gap-2 text-sm ml-2">
            <input
              type="checkbox"
              checked={latestOnly}
              onChange={(e) => setLatestOnly(e.target.checked)}
            />
            Latest messages (24h)
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm">Name</th>
              <th className="px-4 py-2 text-left text-sm">Email</th>
              <th className="px-4 py-2 text-left text-sm">Message</th>
              <th className="px-4 py-2 text-left text-sm">Date</th>
              <th className="px-4 py-2 text-left text-sm">Status</th>
              <th className="px-4 py-2 text-left text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No submissions
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((s) => (
                <tr
                  key={s.id}
                  className={s.read ? "bg-white" : "bg-yellow-50"}
                >
                  <td className="px-4 py-3 text-sm">{s.name}</td>
                  <td className="px-4 py-3 text-sm">{s.email}</td>
                  <td className="px-4 py-3 text-sm max-w-xl truncate">
                    {s.message}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {humanDate(s.createdAt || s.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {s.read ? "Read" : "Unread"}
                  </td>
                  <td className="px-4 py-3 text-sm flex gap-2">
                    <button
                      onClick={() => toggleRead(s.id, s.read)}
                      className="px-2 py-1 rounded border text-sm"
                    >
                      {s.read ? "Mark unread" : "Mark read"}
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="px-2 py-1 rounded border text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {docs.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Page {page + 1} — showing {filtered.length} of {PAGE_SIZE}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={goPrevPage}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={goNextPage}
              disabled={!hasNextPage}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
