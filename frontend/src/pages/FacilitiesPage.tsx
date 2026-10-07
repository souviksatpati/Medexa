import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import { referralApi, type FacilityOut } from "@/api/referralApi";

type FacilityStatus = "Operational" | "Limited" | "Offline";

type Facility = FacilityOut & { status: FacilityStatus };

function toStatus(f: FacilityOut): FacilityStatus {
  if (f.service_availability === "unavailable") return "Offline";
  if (f.service_availability === "limited") return "Limited";
  return "Operational";
}

function StatusBadge({ status }: { status: FacilityStatus }) {
  const styles: Record<FacilityStatus, string> = {
    Operational: "bg-emerald-100 text-emerald-700",
    Limited: "bg-amber-100 text-amber-700",
    Offline: "bg-gray-200 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-on-surface-variant">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-on-surface">
        {value}
      </p>

      <p className="mt-1 text-xs text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

export function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    referralApi.listFacilities("24 PARAGANAS SOUTH")
      .then((rows) => { if (mounted) setFacilities(rows.map((f) => ({ ...f, status: toStatus(f) }))); })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : "Unable to load facilities"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filteredFacilities = useMemo(() => facilities.filter((f) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || f.name.toLowerCase().includes(q) || (f.village_or_ward || "").toLowerCase().includes(q) || (f.id || "").toLowerCase().includes(q);
    return matchesSearch && (statusFilter === "All" || f.status === statusFilter);
  }), [facilities, search, statusFilter]);

  const totalFacilities = facilities.length;
  const primaryHealthCentres = facilities.filter((facility) => facility.facility_type === "phc").length;
  const communityHealthCentres = facilities.filter((facility) => facility.facility_type === "chc").length;
  const operationalFacilities = facilities.filter((facility) => facility.status === "Operational").length;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <div className="flex min-h-screen">
        <DashboardSidebar />

        {/* Main Content */}
        <main className="min-w-0 flex-1 md:ml-64">
          {/* Header */}
          <header className="border-b border-outline-variant bg-surface">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
                  <Link
                    to="/dashboard"
                    className="hover:text-primary"
                  >
                    Dashboard
                  </Link>

                  <span>/</span>

                  <span>Facilities</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                  Facilities
                </h1>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Monitor healthcare facilities and referral activity
                  across the district.
                </p>
              </div>

              <button
                type="button"
                className="hidden rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:opacity-90 sm:block"
              >
                + Add Facility
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
            {/* Statistics */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Facilities"
                value={String(totalFacilities)}
                description="Registered facilities"
              />

              <StatCard
                title="Primary Health Centres"
                value={String(primaryHealthCentres)}
                description="PHCs in the district"
              />

              <StatCard
                title="Community Health Centres"
                value={String(communityHealthCentres)}
                description="CHCs in the district"
              />

              <StatCard
                title="Operational"
                value={String(operationalFacilities)}
                description="Currently operational"
              />
            </section>

            {/* Facility Table */}
            <section className="rounded-2xl border border-outline-variant bg-surface shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-outline-variant p-6 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-bold">
                    Facility Directory
                  </h2>

                  <p className="mt-1 text-sm text-on-surface-variant">
                    All healthcare facilities currently registered in
                    the district.
                  </p>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Search facilities..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary md:w-64"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option>All</option>
                    <option>Operational</option>
                    <option>Limited</option>
                    <option>Offline</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Facility
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Type
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Location
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Contact
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Referrals
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && (
                      <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-on-surface-variant">Loading canonical facility directory…</td></tr>
                    )}
                    {error && !loading && (
                      <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-red-700">{error}</td></tr>
                    )}
                    {!loading && !error && filteredFacilities.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-on-surface-variant">No facilities match the current filters.</td></tr>
                    )}
                    {!loading && !error && filteredFacilities.map((facility) => (
                      <tr
                        key={facility.id}
                        className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container/50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                              {facility.name.charAt(0)}
                            </div>

                            <div>
                              <p className="font-semibold">
                                {facility.name}
                              </p>

                              <p className="mt-1 text-xs text-on-surface-variant">
                                {facility.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm">
                          {facility.facility_type || "Health Facility"}
                        </td>

                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {[facility.district, facility.village_or_ward].filter(Boolean).join(" · ") || "Location not reported"}
                        </td>

                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          —
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-semibold">
                            —
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge status={facility.status} />
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-container"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

           
          </div>
        </main>
      </div>
    </div>
  );
}