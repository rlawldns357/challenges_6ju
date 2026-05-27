import React from "react";
import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import TimerPage from "./pages/TimerPage";
import HistoryPage from "./pages/HistoryPage";
import DashboardPage from "./pages/DashboardPage";
import "./App.css";

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">🍅 Focus Timer</h1>
          <nav className="app-nav">
            <NavLink to="/timer" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Timer</NavLink>
            <NavLink to="/history" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>History</NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/timer" replace />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
