import { useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/common/DashboardSidebar";

interface Medicine {
  name: string;
  category: string;
  facility: string;
  quantity: number;
  lastUpdated: string;
}

const MEDICINES: Medicine[] = [
  {
    name: "Paracetamol",
    category: "Pain & Fever",
    facility: "District Hospital",
    quantity: 245,
    lastUpdated: "10 min ago",
  },
  {
    name: "Amoxicillin",
    category: "Antibiotic",
    facility: "Rural Health Center",
    quantity: 18,
    lastUpdated: "25 min ago",
  },
  {
    name: "ORS",
    category: "Essential",
    facility: "Community Clinic",
    quantity: 120,
    lastUpdated: "18 min ago",
  },
  {
    name: "Insulin",
    category: "Diabetes",
    facility: "District Hospital",
    quantity: 8,
    lastUpdated: "12 min ago",
  },
  {
    name: "Azithromycin",
    category: "Antibiotic",
    facility: "Rural Health Center",
    quantity: 0,
    lastUpdated: "40 min ago",
  },
];

function getStockStatus(quantity: number) {
  if (quantity === 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-100 text-red-700",
    };
  }

  if (quantity < 25) {
    return {
      label: "Low Stock",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "Available",
    className: "bg-green-100 text-green-700",
  };
}

export function MedicineAvailabilityPage() {
  const [search, setSearch] = useState("");

  const filteredMedicines = useMemo(() => {
    return MEDICINES.filter((medicine) => {
      const text =
        `${medicine.name} ${medicine.category} ${medicine.facility}`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [search]);

  const available = MEDICINES.filter((m) => m.quantity >= 25).length;
  const lowStock = MEDICINES.filter(
    (m) => m.quantity > 0 && m.quantity < 25,
  ).length;
  const outOfStock = MEDICINES.filter(
    (m) => m.quantity === 0,
  ).length;

  return (
    <div className="min-h-screen bg-background">

      <DashboardSidebar />

      <main className="min-h-screen md:ml-64">

        {/* HEADER */}
        <header className="border-b border-outline-variant bg-surface px-6 py-6 md:px-10">

          <p className="text-sm font-medium text-primary">
            District Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold text-on-surface">
            Medicine Availability
          </h1>

          <p className="mt-2 text-sm text-on-surface-variant">
            Monitor essential medicine availability across facilities.
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
              title="Low Stock"
              value={lowStock}
              icon="warning"
            />

            <SummaryCard
              title="Out of Stock"
              value={outOfStock}
              icon="error"
              danger
            />

          </div>

          {/* SEARCH */}
          <div className="mt-8 rounded-2xl border border-outline-variant bg-surface p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  Medicine Inventory
                </h2>

                <p className="mt-1 text-sm text-on-surface-variant">
                  Search by medicine or facility.
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
                  placeholder="Search medicines..."
                  className="w-full rounded-xl border border-outline-variant bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
                />

              </div>

            </div>

            {/* TABLE */}
            <div className="mt-6 overflow-x-auto">

              <table className="w-full min-w-[700px] text-left">

                <thead>
                  <tr className="border-b border-outline-variant text-xs uppercase tracking-wide text-on-surface-variant">
                    <th className="px-4 py-4">Medicine</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Facility</th>
                    <th className="px-4 py-4">Quantity</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Updated</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredMedicines.map((medicine) => {
                    const status = getStockStatus(
                      medicine.quantity,
                    );

                    return (
                      <tr
                        key={`${medicine.name}-${medicine.facility}`}
                        className="border-b border-outline-variant last:border-0"
                      >

                        <td className="px-4 py-5 font-semibold text-on-surface">
                          {medicine.name}
                        </td>

                        <td className="px-4 py-5 text-sm text-on-surface-variant">
                          {medicine.category}
                        </td>

                        <td className="px-4 py-5 text-sm text-on-surface-variant">
                          {medicine.facility}
                        </td>

                        <td className="px-4 py-5 font-semibold text-on-surface">
                          {medicine.quantity}
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-4 py-5 text-sm text-on-surface-variant">
                          {medicine.lastUpdated}
                        </td>

                      </tr>
                    );
                  })}

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