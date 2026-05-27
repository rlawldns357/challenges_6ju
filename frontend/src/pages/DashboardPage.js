import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <div className="card" style={{ background: "#7f1d1d" }}>{error}</div>;
  }
  if (!stats) {
    return <div className="card">Loading...</div>;
  }

  const weekdayData = Object.entries(stats.by_weekday).map(([name, minutes]) => ({ name, minutes }));

  return (
    <div className="app-main">
      <div className="card">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_hours}h</div>
            <div className="stat-label">Total Focus</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.sessions_this_week}</div>
            <div className="stat-label">Sessions This Week</div>
          </div>
        </div>
      </div>
      <div className="card">
        <h2>Minutes by Subject</h2>
        {stats.by_subject.length === 0 ? (
          <div className="empty">No data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.by_subject}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
              <Bar dataKey="minutes" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="card">
        <h2>Weekly Pattern</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekdayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
            <Bar dataKey="minutes" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
