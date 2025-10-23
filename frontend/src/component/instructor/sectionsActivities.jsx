import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";
import { InstructorSidebar } from "./instructorSidebar";
import {
  IconChevronLeft, IconPlus, IconPencil, IconTrash, IconClock
} from "@tabler/icons-react";

const categories = [
  { key: "all", label: "All" },
  { key: "classStanding", label: "Class Standing" },
  { key: "laboratory", label: "Laboratory Activities" },
  { key: "majorOutput", label: "Major Output" },
];

const catBadge = (c) =>
  c === "classStanding" ? "bg-blue-100 text-blue-800" :
  c === "laboratory"     ? "bg-green-100 text-green-800" :
  c === "majorOutput"    ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800";

export default function SectionActivities() {
  const { sectionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [section, setSection] = useState(state?.section || null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", category: "classStanding", maxScore: 100
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Ensure section is loaded (for subjectId on create)
        if (!section) {
          const res = await authenticatedFetch(`http://localhost:5000/api/instructor/sections`);
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.message || "Failed to fetch sections");
          }
          const found = (data.sections || []).find(s => String(s._id) === String(sectionId));
          setSection(found || null);
        }

        // Fetch activities (fix double-read of body)
        const res2 = await authenticatedFetch(`http://localhost:5000/api/instructor/sections/${sectionId}/activities`);
        const d2 = await res2.json();
        if (!res2.ok) {
          throw new Error(d2?.message || "Failed to fetch activities");
        }
        setActivities(d2.activities || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading activities");
      } finally {
        setLoading(false);
      }
    })();
  }, [sectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (tab === "all") return activities;
    return activities.filter(a => a.category === tab);
  }, [activities, tab]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ title:"", description:"", category:"classStanding", maxScore:100 });
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditingId(a._id);
    setForm({
      title: a.title || "",
      description: a.description || "",
      category: a.category || "classStanding",
      maxScore: a.maxScore || 100
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!section) return;
    try {
      setSaving(true);

      if (editingId) {
        // UPDATE
        const res = await authenticatedFetch(
          `http://localhost:5000/api/instructor/activities/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, maxScore: Number(form.maxScore) }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.message || "Failed to update activity");
        }
      } else {
        // CREATE
        const res = await authenticatedFetch(
          `http://localhost:5000/api/instructor/subjects/${section?.subject?._id}/activities`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, maxScore: Number(form.maxScore), sectionId }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.message || "Failed to create activity");
        }
      }

      // Refresh list
      const res2 = await authenticatedFetch(`http://localhost:5000/api/instructor/sections/${sectionId}/activities`);
      const d2 = await res2.json();
      setActivities(d2.activities || []);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    try {
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/activities/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to delete");
      }
      setActivities((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete failed");
    }
  };

  const goToScores = (activity) => {
    navigate(
      `/instructor/sections/${sectionId}/activities/${activity._id}/scores`,
      { state: { section, activity } }
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <IconChevronLeft size={18} /> Back
          </button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <IconPlus size={16} /> Add activity
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {section ? `${section?.subject?.subjectCode || ""} ${section?.subject?.subjectName || ""} — ${section?.sectionName || ""}` : "Activities"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Manage activities by category.</p>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setTab(c.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === c.key ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-4">
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-500 text-sm py-10 text-center">No activities found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    {/* Make the left block clickable to open scores */}
                    <button
                      onClick={() => goToScores(a)}
                      className="flex-1 text-left"
                      title="Open scores"
                    >
                      <h3 className="font-semibold text-gray-900 underline-offset-2 hover:underline">
                        {a.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catBadge(a.category)}`}>
                          {a.category === "classStanding" ? "Class Standing" : a.category === "laboratory" ? "Laboratory" : "Major Output"}
                        </span>
                        <span className="text-xs text-gray-500">Max: {a.maxScore}</span>
                      </div>
                      {a.description && <p className="mt-2 text-sm text-gray-700">{a.description}</p>}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <IconClock size={14} /> Created: {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200"
                      >
                        <IconPencil size={14} /> Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(a._id); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        <IconTrash size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-xl mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? "Edit Activity" : "Add Activity"}
              </h3>

              <form onSubmit={submitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="classStanding">Class Standing</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="majorOutput">Major Output</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Score *</label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxScore}
                      onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border rounded"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !form.title.trim()}
                    className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
