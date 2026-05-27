from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)

DB_PATH = os.environ.get("DB_PATH", "focus.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)")
    cur.execute("CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, subject_id INTEGER NOT NULL, duration INTEGER NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY (subject_id) REFERENCES subjects(id))")
    cur.execute("SELECT COUNT(*) AS c FROM subjects")
    if cur.fetchone()["c"] == 0:
        for name in ["Work", "Reading", "Exercise", "Study"]:
            cur.execute("INSERT INTO subjects (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()


init_db()


@app.route("/")
def index():
    return jsonify({"status": "ok", "service": "focus-timer-api"})


@app.route("/subjects", methods=["GET"])
def list_subjects():
    conn = get_db()
    rows = conn.execute("SELECT id, name FROM subjects ORDER BY id").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/subjects", methods=["POST"])
def create_subject():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    conn = get_db()
    try:
        cur = conn.execute("INSERT INTO subjects (name) VALUES (?)", (name,))
        conn.commit()
        new_id = cur.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "subject already exists"}), 409
    conn.close()
    return jsonify({"id": new_id, "name": name}), 201


@app.route("/subjects/<int:sid>", methods=["DELETE"])
def delete_subject(sid):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE subject_id = ?", (sid,))
    conn.execute("DELETE FROM subjects WHERE id = ?", (sid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/sessions", methods=["GET"])
def list_sessions():
    subject_id = request.args.get("subject_id")
    rng = request.args.get("range", "all")
    query = "SELECT s.id, s.subject_id, sub.name AS subject_name, s.duration, s.created_at FROM sessions s JOIN subjects sub ON sub.id = s.subject_id"
    conds = []
    params = []
    if subject_id:
        conds.append("s.subject_id = ?")
        params.append(int(subject_id))
    now = datetime.now(timezone.utc)
    if rng == "week":
        start = now - timedelta(days=7)
        conds.append("s.created_at >= ?")
        params.append(start.isoformat())
    elif rng == "month":
        start = now - timedelta(days=30)
        conds.append("s.created_at >= ?")
        params.append(start.isoformat())
    if conds:
        query += " WHERE " + " AND ".join(conds)
    query += " ORDER BY s.created_at DESC"
    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/sessions", methods=["POST"])
def create_session():
    data = request.get_json() or {}
    subject_id = data.get("subject_id")
    duration = data.get("duration")
    if not subject_id or not duration:
        return jsonify({"error": "subject_id and duration are required"}), 400
    created_at = datetime.now(timezone.utc).isoformat()
    conn = get_db()
    cur = conn.execute("INSERT INTO sessions (subject_id, duration, created_at) VALUES (?, ?, ?)", (subject_id, duration, created_at))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"id": new_id, "subject_id": subject_id, "duration": duration, "created_at": created_at}), 201


@app.route("/sessions/<int:sid>", methods=["DELETE"])
def delete_session(sid):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE id = ?", (sid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/stats", methods=["GET"])
def stats():
    conn = get_db()
    sessions = conn.execute("SELECT s.duration, s.created_at, sub.name AS subject_name FROM sessions s JOIN subjects sub ON sub.id = s.subject_id ORDER BY s.created_at DESC").fetchall()
    conn.close()
    total_minutes = sum(s["duration"] for s in sessions)
    total_hours = round(total_minutes / 60, 2)
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    sessions_this_week = sum(1 for s in sessions if datetime.fromisoformat(s["created_at"]) >= week_start)
    days = set()
    for s in sessions:
        d = datetime.fromisoformat(s["created_at"]).date()
        days.add(d)
    streak = 0
    cur_day = now.date()
    while cur_day in days:
        streak += 1
        cur_day = cur_day - timedelta(days=1)
    by_subject_map = {}
    for s in sessions:
        by_subject_map[s["subject_name"]] = by_subject_map.get(s["subject_name"], 0) + s["duration"]
    by_subject = [{"name": k, "minutes": v} for k, v in by_subject_map.items()]
    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    by_weekday = {n: 0 for n in weekday_names}
    for s in sessions:
        wd = datetime.fromisoformat(s["created_at"]).weekday()
        by_weekday[weekday_names[wd]] += s["duration"]
    return jsonify({"streak": streak, "total_hours": total_hours, "sessions_this_week": sessions_this_week, "by_subject": by_subject, "by_weekday": by_weekday})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
