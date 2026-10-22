"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const emptyForm = {
  name: "",
  specialty: "",
  email: "",
  phone: "",
  department: "",
  hospital: "",
  experienceYears: 0,
  status: "active",
};

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function handleRequestError(err) {
    if (/unauthori[sz]ed|not authorized|authentication|token|login|session/i.test(err.message || "")) {
      router.replace("/login");
      return;
    }
    setError(err.message || "Something went wrong. Please try again.");
  }

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
      });
      if (statusFilter) params.set("status", statusFilter);
      if (specialtyFilter.trim()) params.set("specialty", specialtyFilter.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const result = await api(`/doctors?${params.toString()}`);
      // The API returns records in result.data and pagination metadata separately.
      const records = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.doctors)
          ? result.data.doctors
          : Array.isArray(result.doctors)
            ? result.doctors
            : [];
      const totalPages =
        result.pagination?.totalPages ??
        result.data?.pagination?.totalPages ??
        result.totalPages ??
        1;

      setDoctors(records);
      setPages(Math.max(1, totalPages));
      setTotalRecords(result.pagination?.total ?? result.data?.pagination?.total ?? records.length);
      if (page > Math.max(1, totalPages)) {
        setPage(Math.max(1, totalPages));
      }
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, specialtyFilter, dateFrom, dateTo, router]);

  useEffect(() => {
    const timer = setTimeout(loadDoctors, 250);
    return () => clearTimeout(timer);
  }, [loadDoctors]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function startEdit(doctor) {
    setEditingId(doctor._id);
    setForm({
      name: doctor.name ?? "",
      specialty: doctor.specialty ?? "",
      email: doctor.email ?? "",
      phone: doctor.phone ?? "",
      department: doctor.department ?? "",
      hospital: doctor.hospital ?? "",
      experienceYears: doctor.experienceYears ?? 0,
      status: doctor.status ?? "active",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  async function saveDoctor(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const result = await api(
        editingId ? `/doctors/${editingId}` : "/doctors",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            experienceYears: Number(form.experienceYears),
          }),
        }
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setNotice(result.message || "Doctor saved successfully.");
      await loadDoctors();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteDoctor(doctor) {
    if (!window.confirm(`Delete ${doctor.name}? This action cannot be undone.`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await api(`/doctors/${doctor._id}`, { method: "DELETE" });
      setNotice("Doctor deleted successfully.");
      await loadDoctors();
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
          <Link className="rounded-lg bg-blue-600 px-4 py-3" href="/doctors">⚕ Doctors</Link>
          <Link className="rounded-lg px-4 py-3 hover:bg-slate-800" href="/patients">♙ Patients</Link>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Directory</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Doctors</h1>
            <p className="mt-2 text-slate-500">Manage doctor records and availability.</p>
          </div>
          <button onClick={startCreate} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            + Add doctor
          </button>
        </header>

        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">{notice}</p>}

        {showForm && (
          <form onSubmit={saveDoctor} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-slate-900">{editingId ? "Edit doctor" : "Add a doctor"}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["name", "Full name", "text"],
                ["specialty", "Specialty", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["department", "Department", "text"],
                ["hospital", "Hospital / Clinic", "text"],
                ["experienceYears", "Years of experience", "number"],
              ].map(([key, label, type]) => (
                <label key={key} className="text-sm font-medium text-slate-700">
                  {label}
                  <input
                    type={type}
                    required={key !== "department" && key !== "hospital"}
                    min={type === "number" ? "0" : undefined}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </label>
              ))}
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
                {editingId ? "Save changes" : "Create doctor"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-slate-700">
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, specialty, email, hospital..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-3"
                aria-label="Filter doctors by status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <input
                value={specialtyFilter}
                onChange={(e) => { setSpecialtyFilter(e.target.value); setPage(1); }}
                placeholder="Exact specialty filter"
                aria-label="Filter doctors by specialty"
                className="w-full rounded-lg border border-slate-300 px-3 py-3"
              />
              <label className="text-xs text-slate-500">
                Created from
                <input type="date" value={dateFrom} max={dateTo || undefined}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              </label>
              <label className="text-xs text-slate-500">
                Created to
                <input type="date" value={dateTo} min={dateFrom || undefined}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              </label>
            </div>
            <button
              type="button"
              onClick={() => { setSearch(""); setStatusFilter(""); setSpecialtyFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="mt-3 text-sm font-medium text-blue-700 hover:underline"
            >Clear filters</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["Doctor", "Specialty", "Department", "Hospital", "Experience", "Status", "Patients", "Actions"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-5 py-4 font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="font-semibold text-slate-800">{doctor.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{doctor.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{doctor.specialty}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{doctor.department || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{doctor.hospital || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{doctor.experienceYears ?? 0} years</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {doctor.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link href={`/patients?doctor=${doctor._id}`} className="font-medium text-blue-600 hover:underline">View patients</Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button onClick={() => startEdit(doctor)} className="mr-3 font-medium text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => deleteDoctor(doctor)} className="font-medium text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {!loading && doctors.length === 0 && (
                  <tr><td colSpan="8" className="px-5 py-12 text-center text-slate-500">No doctors found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{totalRecords === 0 ? "Showing 0 records" : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, totalRecords)} of ${totalRecords}`}</span>
              <label className="flex items-center gap-2">
                Rows per page
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700">
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
              </label>
              <span>Page {page} of {pages}</span>
            </div>
            <div className="flex gap-2">
              <button disabled={page <= 1 || loading} onClick={() => setPage(1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">First</button>
              <button disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40">Previous</button>
              <button disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40">Next</button>
              <button disabled={page >= pages || loading} onClick={() => setPage(pages)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">Last</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
