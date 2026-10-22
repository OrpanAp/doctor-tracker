import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "../screenshots");
const baseURL = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:3000";
await mkdir(outputDir, { recursive: true });

const doctors = [
  { _id: "66a000000000000000000001", name: "Dr. Sarah Ahmed", specialty: "Cardiology", hospital: "Central Medical Center", email: "sarah.ahmed@example.test", phone: "+8801700000001", department: "Cardiology", experienceYears: 12, status: "active", createdAt: "2026-10-01T09:00:00.000Z" },
  { _id: "66a000000000000000000002", name: "Dr. Mohammad Rahman", specialty: "Neurology", hospital: "City General Hospital", email: "m.rahman@example.test", phone: "+8801700000002", department: "Neurology", experienceYears: 9, status: "active", createdAt: "2026-09-18T09:00:00.000Z" },
];
const patients = [
  { _id: "66b000000000000000000001", name: "Ayesha Karim", age: 34, condition: "Hypertension", phone: "+8801800000001", doctor: { _id: doctors[0]._id, name: doctors[0].name, specialty: doctors[0].specialty }, createdAt: "2026-10-12T09:00:00.000Z" },
  { _id: "66b000000000000000000002", name: "Tanvir Hasan", age: 47, condition: "Migraine", phone: "+8801800000002", doctor: { _id: doctors[1]._id, name: doctors[1].name, specialty: doctors[1].specialty }, createdAt: "2026-10-10T09:00:00.000Z" },
  { _id: "66b000000000000000000003", name: "Nusrat Jahan", age: 29, condition: "Asthma", phone: "+8801800000003", doctor: { _id: doctors[0]._id, name: doctors[0].name, specialty: doctors[0].specialty }, createdAt: "2026-10-08T09:00:00.000Z" },
];
const monthly = [
  { month: "May", year: 2026, count: 3 },
  { month: "Jun", year: 2026, count: 4 },
  { month: "Jul", year: 2026, count: 5 },
  { month: "Aug", year: 2026, count: 6 },
  { month: "Sep", year: 2026, count: 8 },
  { month: "Oct", year: 2026, count: 10 },
];
const dashboard = {
  success: true,
  data: {
    totalDoctors: 2,
    activeDoctors: 2,
    inactiveDoctors: 0,
    totalPatients: 3,
    recentPatients: patients,
    patientsByCondition: [{ condition: "Hypertension", count: 1 }, { condition: "Migraine", count: 1 }, { condition: "Asthma", count: 1 }],
    patientsByDoctor: [{ doctor: doctors[0].name, count: 2 }, { doctor: doctors[1].name, count: 1 }],
    monthlyPatientRegistrations: monthly,
    monthlyDoctorRegistrations: monthly.map((item) => ({ ...item, count: Math.max(1, item.count - 3) })),
  },
};

async function mockApi(page) {
  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const payload = pathname.endsWith("/dashboard")
      ? dashboard
      : pathname.endsWith("/doctors")
        ? { success: true, data: doctors, pagination: { total: doctors.length, page: 1, limit: 10, totalPages: 1 } }
        : pathname.endsWith("/patients")
          ? { success: true, data: patients, pagination: { total: patients.length, page: 1, limit: 10, totalPages: 1 } }
          : { success: true, message: "Mock response" };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await mockApi(desktop);
  await desktop.goto(baseURL + "/dashboard", { waitUntil: "networkidle" });
  await desktop.getByText("Registration trends").waitFor();
  await desktop.screenshot({ path: path.join(outputDir, "dashboard-desktop.png"), fullPage: true });

  const mobileDashboard = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mockApi(mobileDashboard);
  await mobileDashboard.goto(baseURL + "/dashboard", { waitUntil: "networkidle" });
  await mobileDashboard.getByText("Registration trends").waitFor();
  await mobileDashboard.screenshot({ path: path.join(outputDir, "dashboard-mobile.png"), fullPage: true });

  const mobileDoctors = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mockApi(mobileDoctors);
  await mobileDoctors.goto(baseURL + "/doctors", { waitUntil: "networkidle" });
  await mobileDoctors.getByText("Dr. Sarah Ahmed").waitFor();
  await mobileDoctors.screenshot({ path: path.join(outputDir, "doctors-mobile.png"), fullPage: true });

  const mobilePatients = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mockApi(mobilePatients);
  await mobilePatients.goto(baseURL + "/patients", { waitUntil: "networkidle" });
  await mobilePatients.getByText("Ayesha Karim").waitFor();
  await mobilePatients.screenshot({ path: path.join(outputDir, "patients-mobile.png"), fullPage: true });

  for (const width of [1170, 1171]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await mockApi(page);
    await page.goto(baseURL + "/doctors", { waitUntil: "networkidle" });
    await page.getByText("Dr. Sarah Ahmed").waitFor();
    await page.screenshot({ path: path.join(outputDir, `doctors-${width}px.png`), fullPage: true });
    await page.close();
  }
  console.log("Captured six genuine UI screenshots with fictional demo data.");
} finally {
  await browser.close();
}
