import React, { useEffect, useState } from "react";
import { api } from "../api";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    try {
      const subs = await api.listSubjects();
      setSubjects(subs);
      const params = {};
      if (subjectFilter) params.subject_id = subjectFilter;
      if (rangeFilter && rangeFilter !== "all") params.range = rangeFilter;
      const list = await api.listSessions(params);
      setSessions(list);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [subjectFilter, rangeFilter]);

  async function remove(id) {
    if (!window.confirm("Delete this session?")) return;
    try {
      await api.deleteSession(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app-main">
      {error && <div className="card" style={{ background: "#7f1d1d" }}>{error}</div>}
      <div className="card">
        <h2>History</h2>
        <div className="row">
          <label>Subject:</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">All</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <label>Range:</label>
          <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>
      </div>
      <div className="card">
        {sessions.length === 0 ? (
          <div className="empty">No sessions yet. Start a focus session to see it here!</div>
        ) : (
          sessions.map((s) => (
            <div className="session-item" key={s.id}>
              <div>
                <div><strong>{s.subject_name}</strong> &middot; {s.duration} min</div>
                <div className="session-meta">{formatDate(s.created_at)}</div>
              </div>
              <button className="btn danger" onClick={() => remove(s.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
