import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const STORAGE_KEY = "focusTimerState";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return m + ":" + s;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    /* ignore */
  }
}

export default function TimerPage() {
  const [subjects, setSubjects] = useState([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [mode, setMode] = useState("focus");
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSubjects();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.mode) setMode(data.mode);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
        if (data.selectedSubject) setSelectedSubject(data.selectedSubject);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, remaining, selectedSubject }));
  }, [mode, remaining, selectedSubject]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          handleComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [running]);

  async function loadSubjects() {
    try {
      const list = await api.listSubjects();
      setSubjects(list);
      if (list.length > 0 && !selectedSubject) setSelectedSubject(String(list[0].id));
    } catch (e) {
      setError("Failed to load subjects. Is the backend running?");
    }
  }

  async function handleComplete() {
    setRunning(false);
    playBeep();
    if (mode === "focus") {
      if (selectedSubject) {
        try {
          await api.createSession(parseInt(selectedSubject, 10), Math.round(FOCUS_SECONDS / 60));
        } catch (e) {
          setError("Failed to save session");
        }
      }
      setMode("break");
      setRemaining(BREAK_SECONDS);
      setTimeout(() => setRunning(true), 500);
    } else {
      setMode("focus");
      setRemaining(FOCUS_SECONDS);
    }
  }

  function start() {
    if (mode === "focus" && !selectedSubject) {
      setError("Please select a subject first.");
      return;
    }
    setError("");
    setRunning(true);
  }
  function pause() { setRunning(false); }
  function reset() {
    setRunning(false);
    setMode("focus");
    setRemaining(FOCUS_SECONDS);
  }

  async function addSubject(e) {
    e.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;
    try {
      await api.createSubject(name);
      setNewSubjectName("");
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSubject(id) {
    if (!window.confirm("Delete this subject and its sessions?")) return;
    try {
      await api.deleteSubject(id);
      loadSubjects();
    } catch (err) {
      setError(err.message);
    }
  }

  const total = mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS;
  const progress = ((total - remaining) / total) * 100;

  return (
    <div className="app-main">
      {error && <div className="card" style={{ background: "#7f1d1d" }}>{error}</div>}
      <div className="card">
        <div className="timer-state">{mode === "focus" ? "Focus Session" : "Break Time"}</div>
        <div className="timer-display">{formatTime(remaining)}</div>
        <div className="timer-progress"><div style={{ width: progress + "%" }}></div></div>
        <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
          {!running ? (
            <button className="btn" onClick={start}>Start</button>
          ) : (
            <button className="btn secondary" onClick={pause}>Pause</button>
          )}
          <button className="btn secondary" onClick={reset}>Reset</button>
        </div>
      </div>
      <div className="card">
        <h2>Subject</h2>
        <div className="row">
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="">-- select subject --</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <h3 style={{ marginTop: 24 }}>Manage subjects</h3>
        <form className="row" onSubmit={addSubject}>
          <input type="text" placeholder="New subject name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} />
          <button className="btn" type="submit">Add</button>
        </form>
        <div className="row" style={{ marginTop: 12 }}>
          {subjects.map((s) => (
            <span key={s.id} className="subject-pill">{s.name} <button onClick={() => removeSubject(s.id)} title="Delete">x</button></span>
          ))}
        </div>
      </div>
    </div>
  );
}
