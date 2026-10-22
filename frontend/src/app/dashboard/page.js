"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/dashboard")
      .then((result) => setData(result.data || result))
      .catch((err) => {
        if (/unauthorized|authentication|token|login/i.test(err.message)) {
          router.replace("/login");
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Redirect even if the logout endpoint is unavailable.
    }
    router.replace("/login");
  }

  const stats = [
    { label: "Total Doctors", value: data?.totalDoctors ?? 0, icon: "⚕️", color: "blue" },
    { label: "Active Doctors", value: data?.activeDoctors ?? 0, icon: "✓", color: "green" },
    { label: "Inactive Doctors", value: data?.inactiveDoctors ?? 0, icon: "◷", color: "amber" },
    { label: "Total Patients", value: data?.totalPatients ?? 0, icon: "♙", color: "purple" },
  ];

  if (loading) {
    return <main className="p-10 text-slate-500">Loading dashboard...</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50 min-[1171px]:flex">
      <aside className="bg-slate-950 p-6 text-white min-[1171px]:min-h-screen min-[1171px]:w-64">
        <h1 className="mb-8 text-xl font-bold">✚ Doctor Tracker</h1>
        <nav className="flex flex-wrap gap-2 min-[1171px]:flex-col">
          <Link className="rounded-lg bg-blue-600 px-4 py-3" href="/dashboard">▦ Dashboard</Link>
          <Link className="rounded-lg px-4 py-3 hover:bg-slate-800" href="/doctors">⚕ Doctors</Link>
          <Link className="rounded-lg px-4 py-3 hover:bg-slate-800" href="/patients">♙ Patients</Link>
        </nav>
        <button onClick={logout} className="mt-8 rounded-lg px-4 py-3 text-slate-300 hover:bg-slate-800">
          ↪ Sign out
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-5 min-[1171px]:p-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Overview</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h2>
            <p className="mt-2 text-slate-500">Welcome to your healthcare management portal.</p>
          </div>
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            ● System overview
          </span>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}. Check that the backend is running and you are signed in.
          </div>
        )}

        <section className="grid gap-5 min-[1171px]:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="mt-5 text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-400">Current records</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900">Registration trends</h3>
          <p className="mt-1 text-sm text-slate-500">New doctors and patients registered over the last six months.</p>
          <div className="mt-5 grid grid-cols-3 gap-3 min-[1171px]:grid-cols-6 min-[1171px]:gap-4">
            {(data?.monthlyPatientRegistrations || []).map((item, index) => {
              const doctorCount = data?.monthlyDoctorRegistrations?.[index]?.count || 0;
              const max = Math.max(1, ...(data?.monthlyPatientRegistrations || []).map((x) => x.count), ...(data?.monthlyDoctorRegistrations || []).map((x) => x.count));
              return <div key={item.month + item.year} className="flex min-w-0 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end justify-center gap-1 rounded-lg bg-slate-50 px-1">
                  <div title={item.count + " patients"} className="w-1/3 rounded-t bg-blue-600" style={{ height: Math.max(3, (item.count / max) * 100) + "%" }} />
                  <div title={doctorCount + " doctors"} className="w-1/3 rounded-t bg-emerald-500" style={{ height: Math.max(3, (doctorCount / max) * 100) + "%" }} />
                </div>
                <span className="text-center text-xs text-slate-500">{item.month}</span>
                <span className="text-[10px] font-semibold text-slate-700">{item.count} / {doctorCount}</span>
              </div>;
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">Blue = patients · Green = doctors. Values below each month show patient / doctor registrations.</p>
        </section>

        <section className="mt-8 grid gap-6 min-[1171px]:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Patients by condition</h3>
              <span className="text-xl">▥</span>
            </div>
            {(data?.patientsByCondition || []).length === 0 ? (
              <p className="py-8 text-sm text-slate-500">No condition data available yet.</p>
            ) : (
              <div className="space-y-5">
                {data.patientsByCondition.map((item) => {
                  const max = Math.max(...data.patientsByCondition.map((x) => x.count), 1);
                  return (
                    <div key={item.condition}>
                      <div className="mb-2 flex justify-between gap-3 text-sm">
                        <span className="text-slate-700">{item.condition}</span>
                        <span className="font-semibold text-slate-900">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${(item.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-5 text-lg font-bold text-slate-900">Patients by doctor</h3>
            {(data?.patientsByDoctor || []).length === 0 ? (
              <p className="py-8 text-sm text-slate-500">No doctor assignments available yet.</p>
            ) : (
              <div className="space-y-3">
                {data.patientsByDoctor.map((item) => (
                  <div key={item.doctor} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <span className="text-sm text-slate-700">{item.doctor}</span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Recent patients</h3>
            <Link href="/patients" className="text-sm font-semibold text-blue-600 hover:text-blue-800">View all →</Link>
          </div>
          <div className="grid gap-3 min-[1171px]:hidden">
            {(data?.recentPatients || []).map((patient) => <article key={patient._id} className="min-w-0 rounded-xl border border-slate-100 p-3">
              <p className="break-words font-semibold text-slate-800">{patient.name}</p>
              <p className="mt-1 break-words text-sm text-slate-600">{patient.condition}</p>
              <p className="mt-1 break-words text-xs text-slate-500">Age: {patient.age ?? "—"} · Doctor: {patient.doctor?.name || "—"}</p>
            </article>)}
            {(data?.recentPatients || []).length === 0 && <p className="py-6 text-center text-sm text-slate-500">No patients registered yet.</p>}
          </div>
          <div className="hidden min-[1171px]:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Patient</th>
                  <th className="px-3 py-3 font-medium">Condition</th>
                  <th className="px-3 py-3 font-medium">Age</th>
                  <th className="px-3 py-3 font-medium">Doctor</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentPatients || []).map((patient) => (
                  <tr key={patient._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4 font-medium text-slate-800">{patient.name}</td>
                    <td className="px-3 py-4 text-slate-600">{patient.condition}</td>
                    <td className="px-3 py-4 text-slate-600">{patient.age ?? "—"}</td>
                    <td className="px-3 py-4 text-slate-600">{patient.doctor?.name || "—"}</td>
                  </tr>
                ))}
                {(data?.recentPatients || []).length === 0 && (
                  <tr><td colSpan="4" className="px-3 py-8 text-center text-slate-500">No patients registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
