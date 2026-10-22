"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const emptyForm = {
  name: "",
  age: "",
  condition: "",
  phone: "",
  doctor: "",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await api(
        `/patients?page=${page}&limit=10&search=${encodeURIComponent(search)}`
      );
      // The API returns records in result.data and pagination metadata separately.
      const records = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.patients)
          ? result.data.patients
          : Array.isArray(result.patients)
            ? result.patients
            : [];
      const totalPages =
        result.pagination?.totalPages ??
        result.data?.pagination?.totalPages ??
        result.totalPages ??
        1;

      setPatients(records);
      setPages(Math.max(1, totalPages));
      if (page > Math.max(1, totalPages)) {
        setPage(Math.max(1, totalPages));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadDoctors = useCallback(async () => {
    try {
      const result = await api("/doctors?page=1&limit=100");
      const payload = result.data ?? result;
      setDoctors(Array.isArray(payload) ? payload : payload.doctors ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadPatients, 250);
    return () => clearTimeout(timer);
  }, [loadPatients]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function startEdit(patient) {
    setEditingId(patient._id);
    setForm({
      name: patient.name ?? "",
      age: patient.age ?? "",
      condition: patient.condition ?? "",
      phone: patient.phone ?? "",
      doctor: patient.doctor?._id ?? patient.doctor ?? "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function savePatient(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const body = {
        ...form,
        age: Number(form.age),
      };

      const result = await api(
        editingId ? `/patients/${editingId}` : "/patients",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(body),
        }
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setNotice(result.message || "Patient saved successfully.");
      await loadPatients();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePatient(patient) {
    if (!window.confirm(`Delete patient ${patient.name}? This cannot be undone.`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api(`/patients/${patient._id}`, { method: "DELETE" });
      setNotice("Patient deleted successfully.");
      await loadPatients();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="bg-slate-950 p-6 text-white md:min-h-screen md:w-64">
        <Link href="/dashboard" className="mb-8 block text-xl font-bold">
          ✚ Doctor Tracker
        </Link>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          <Link className="rounded-lg px-4 py-3 hover:bg-slate-800" href="/dashboard">▦ Dashboard</Link>
          <Link className="rounded-lg px-4 py-3 hover:bg-slate-800" href="/doctors">⚕ Doctors</Link>
          <Link className="rounded-lg bg-blue-600 px-4 py-3" href="/patients">♙ Patients</Link>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Directory</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Patients</h1>
            <p className="mt-2 text-slate-500">Manage patient records and assigned doctors.</p>
          </div>
          <button
            onClick={startCreate}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Add patient
          </button>
        </header>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {notice}
          </p>
        )}

        {showForm && (
          <form onSubmit={savePatient} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-slate-900">
              {editingId ? "Edit patient" : "Add a patient"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Full name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="Patient name"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Age
                <input
                  required
                  type="number"
                  min="0"
                  max="125"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="Age"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Condition
                <input
                  required
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="e.g. Hypertension"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="Phone number"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Assigned doctor
                <select
                  required
                  value={form.doctor}
                  onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} — {doctor.specialty}
                    </option>
                  ))}
                </select>
                {doctors.length === 0 && (
                  <span className="mt-1 block text-xs text-amber-700">
                    Add a doctor before registering a patient.
                  </span>
                )}
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                disabled={doctors.length === 0}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {editingId ? "Save changes" : "Create patient"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search patient, condition, or phone..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 sm:max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["Patient", "Age", "Condition", "Phone", "Assigned doctor", "Actions"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-5 py-4 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {patient.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {patient.age ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {patient.condition}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {patient.phone || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {patient.doctor?.name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        onClick={() => startEdit(patient)}
                        className="mr-3 font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePatient(patient)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && patients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 p-4">
            <span className="text-sm text-slate-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
