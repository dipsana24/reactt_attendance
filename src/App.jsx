import React, { useEffect, useMemo, useState } from "react";

const LS_STUDENTS = "att_students_v1";
const LS_ATT = "att_records_v1"; // { "YYYY-MM-DD": { studentId: "Present"|"Absent" } }

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function App() {
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState(() => loadJSON(LS_STUDENTS, []));
  const [records, setRecords] = useState(() => loadJSON(LS_ATT, {}));

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // student or null
  const [form, setForm] = useState({ name: "", roll: "" });

  useEffect(() => saveJSON(LS_STUDENTS, students), [students]);
  useEffect(() => saveJSON(LS_ATT, records), [records]);

  const dayMap = records[date] || {};

  const sorted = useMemo(() => {
    return [...students].sort((a, b) => {
      const nameDiff = a.name.localeCompare(b.name);
      if (nameDiff !== 0) return nameDiff;
      return String(a.roll).localeCompare(String(b.roll), undefined, {
        numeric: true,
      });
    });
  }, [students]);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", roll: "" });
    setOpen(true);
  }
  function openEdit(st) {
    setEditing(st);
    setForm({ name: st.name, roll: st.roll });
    setOpen(true);
  }

  function saveStudent(e) {
    e.preventDefault();
    const name = form.name.trim();
    const roll = String(form.roll).trim();
    if (!name || !roll) return;

    if (!editing) {
      setStudents((prev) => [...prev, { id: uid(), name, roll }]);
    } else {
      setStudents((prev) =>
        prev.map((s) => (s.id === editing.id ? { ...s, name, roll } : s)),
      );
    }
    setOpen(false);
  }

  function deleteStudent(id) {
    if (!confirm("Delete this student?")) return;

    setStudents((prev) => prev.filter((s) => s.id !== id));

    // remove from attendance records too
    setRecords((prev) => {
      const next = { ...prev };
      for (const d of Object.keys(next)) {
        if (next[d]?.[id]) {
          const { [id]: _, ...rest } = next[d];
          next[d] = rest;
        }
      }
      return next;
    });
  }

  function mark(id, status) {
    setRecords((prev) => {
      const next = { ...prev };
      const map = { ...(next[date] || {}) };
      map[id] = status;
      next[date] = map;
      return next;
    });
  }

  return (
    <div className="container">
      <div className="card">
        <div className="top">
          <div>
            <h1>Attendance App (React)</h1>
            <div className="muted">
              Add students and mark attendance by date.
            </div>
          </div>

          <div className="row" style={{ marginTop: 0 }}>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ minWidth: 160, flex: "unset" }}
            />
            <button className="btn primary" onClick={openAdd}>
              + Add Student
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="empty">No students yet. Click “Add Student”.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Roll</th>
                <th>Name</th>
                <th style={{ width: 140 }}>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const status = dayMap[s.id] || "Not Marked";
                return (
                  <tr key={s.id}>
                    <td>{s.roll}</td>
                    <td style={{ fontWeight: 700 }}>{s.name}</td>
                    <td>
                      {status === "Present" ? (
                        <span className="pill present">Present</span>
                      ) : status === "Absent" ? (
                        <span className="pill absent">Absent</span>
                      ) : (
                        <span className="pill">Not Marked</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn"
                          onClick={() => mark(s.id, "Present")}
                        >
                          Present
                        </button>
                        <button
                          className="btn"
                          onClick={() => mark(s.id, "Absent")}
                        >
                          Absent
                        </button>
                        <button className="btn" onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => deleteStudent(s.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="modalOverlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3>{editing ? "Edit Student" : "Add Student"}</h3>
              <button className="btn" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={saveStudent}>
              <div className="label">Name</div>
              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g., Sita Sharma"
              />

              <div className="label">Roll</div>
              <input
                className="input"
                value={form.roll}
                onChange={(e) =>
                  setForm((p) => ({ ...p, roll: e.target.value }))
                }
                placeholder="e.g., 12"
              />

              <div className="row" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
