const DEFAULT_API = "http://localhost:5000";
const API_BASE = (process.env.REACT_APP_API_BASE || DEFAULT_API).replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("API error " + res.status + ": " + text);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listSubjects: () => request("/subjects"),
  createSubject: (name) => request("/subjects", { method: "POST", body: JSON.stringify({ name }) }),
  deleteSubject: (id) => request("/subjects/" + id, { method: "DELETE" }),
  listSessions: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.subject_id) qs.set("subject_id", params.subject_id);
    if (params.range) qs.set("range", params.range);
    const q = qs.toString();
    return request("/sessions" + (q ? "?" + q : ""));
  },
  createSession: (subject_id, duration) => request("/sessions", { method: "POST", body: JSON.stringify({ subject_id, duration }) }),
  deleteSession: (id) => request("/sessions/" + id, { method: "DELETE" }),
  stats: () => request("/stats"),
};

export { API_BASE };
