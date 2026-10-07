import { useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

interface DiagnosticTest {
  test: string;
  facility: string;
  availability: "Available" | "Limited" | "Unavailable";
  waitingTime: string;
  lastUpdated: string;
}

const DIAGNOSTICS: DiagnosticTest[] = [
  {
    test: "Complete Blood Count",
    facility: "District Hospital",
    availability: "Available",
    waitingTime: "30 min",
    lastUpdated: "12 min ago",
  },
  {
    test: "X-Ray",
    facility: "District Hospital",
    availability: "Available",
    waitingTime: "45 min",
    lastUpdated: "20 min ago",
  },
  {
    test: "Ultrasound",
    facility: "Rural Hospital",
    availability: "Limited",
    waitingTime: "2 hours",
    lastUpdated: "35 min ago",
  },
  {
    test: "Blood Glucose",
    facility: "Community Clinic",
    availability: "Available",
    waitingTime: "15 min",
    lastUpdated: "8 min ago",
  },
  {
    test: "ECG",
    facility: "Rural Hospital",
    availability: "Unavailable",
    waitingTime: "—",
    lastUpdated: "1 hour ago",
  },
];

function availabilityStyle(
  availability: DiagnosticTest["availability"],
) {
  if (availability === "Available") {
    return "bg-green-100 text-green-700";
  }

  if (availability === "Limited") {
    return "bg-yellow-100 text-yellow-700";
  }

  return "bg-red-100 text-red-700";
}

export function DiagnosticsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return DIAGNOSTICS.filter((item) => {
      const text =
        `${item.test} ${item.facility}`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [search]);

  const available = DIAGNOSTICS.filter(
    (item) => item.availability === "Available",
  ).length;

  const limited = DIAGNOSTICS.filter(
    (item) => item.availability === "Limited",
  ).length;

  const unavailable = DIAGNOSTICS.filter(
    (item) => item.availability === "Unavailable",
  ).length;

  return (
    <div className="min-h-screen bg-background">

      <DashboardSidebar />

      <main className="min-h-screen md:ml-64">

        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">

          <p className="text-sm font-medium text-primary">
            District Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-on-surface">
            Diagnostic Coordination
          </h1>

          <p className="mt-2 text-sm text-on-surface-variant">
            View diagnostic service availability and expected waiting time.
          </p>

        </header>

        <div className="p-6 md:p-10">

          {/* SUMMARY */}
          <div className="grid gap-5 md:grid-cols-3">

            <SummaryCard
              title="Available"
              value={available}
              icon="check_circle"
            />

            <SummaryCard
              title="Limited"
              value={limited}
              icon="schedule"
            />

            <SummaryCard
              title="Unavailable"
              value={unavailable}
              icon="error"
              danger
            />

          </div>

          {/* SERVICES */}
          <div className="mt-8 rounded-2xl border border-outline-variant bg-surface p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  Diagnostic Services
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Find the nearest available diagnostic service.
                </p>
              </div>

              <div className="relative w-full md:w-80">

                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  search
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tests..."
                  className="w-full rounded-xl border border-outline-variant bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
                />

              </div>

            </div>

            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[700px] text-left">

                <thead>
                  <tr className="border-b border-outline-variant text-xs uppercase tracking-wide text-on-surface-variant">

                    <th className="px-4 py-4">
                      Diagnostic Test
                    </th>

                    <th className="px-4 py-4">
                      Facility
                    </th>

                    <th className="px-4 py-4">
                      Availability
                    </th>

                    <th className="px-4 py-4">
                      Waiting Time
                    </th>

                    <th className="px-4 py-4">
                      Updated
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filtered.map((item) => (
                    <tr
                      key={`${item.test}-${item.facility}`}
                      className="border-b border-outline-variant last:border-0"
                    >

                      <td className="px-4 py-5 font-semibold text-on-surface">
                        {item.test}
                      </td>

                      <td className="px-4 py-5 text-sm text-on-surface-variant">
                        {item.facility}
                      </td>

                      <td className="px-4 py-5">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${availabilityStyle(
                            item.availability,
                          )}`}
                        >
                          {item.availability}
                        </span>

                      </td>

                      <td className="px-4 py-5 text-sm font-medium text-on-surface">
                        {item.waitingTime}
                      </td>

                      <td className="px-4 py-5 text-sm text-on-surface-variant">
                        {item.lastUpdated}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  danger?: boolean;
}

function SummaryCard({
  title,
  value,
  icon,
  danger = false,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-6">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-on-surface-variant">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-on-surface">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            danger
              ? "bg-error-container text-error"
              : "bg-gray-200 text-primary"
          }`}
        >
          <span className="material-symbols-outlined">
            {icon}
          </span>
        </div>

      </div>

    </div>
  );
}