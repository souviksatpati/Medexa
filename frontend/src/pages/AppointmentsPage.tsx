import { DashboardSidebar } from "@/components/common/DashboardSidebar";

interface Appointment {
  time: string;
  patient: string;
  service: string;
  facility: string;
  status: "Waiting" | "In Consultation" | "Completed";
}

const APPOINTMENTS: Appointment[] = [
  {
    time: "09:00 AM",
    patient: "Patient A",
    service: "General Medicine",
    facility: "District Hospital",
    status: "Completed",
  },
  {
    time: "09:30 AM",
    patient: "Patient B",
    service: "Pediatrics",
    facility: "District Hospital",
    status: "In Consultation",
  },
  {
    time: "10:00 AM",
    patient: "Patient C",
    service: "General Medicine",
    facility: "Rural Hospital",
    status: "Waiting",
  },
  {
    time: "10:30 AM",
    patient: "Patient D",
    service: "Cardiology",
    facility: "District Hospital",
    status: "Waiting",
  },
];

function statusStyle(status: Appointment["status"]) {
  if (status === "Completed") {
    return "bg-green-100 text-green-700";
  }

  if (status === "In Consultation") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export function AppointmentsPage() {
  const waiting = APPOINTMENTS.filter(
    (item) => item.status === "Waiting",
  ).length;

  const completed = APPOINTMENTS.filter(
    (item) => item.status === "Completed",
  ).length;

  const inConsultation = APPOINTMENTS.filter(
    (item) => item.status === "In Consultation",
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
            Appointments & Queue
          </h1>

          <p className="mt-2 text-sm text-on-surface-variant">
            Monitor today's appointments, waiting patients and consultations.
          </p>

        </header>

        <div className="p-6 md:p-10">

          {/* SUMMARY */}
          <div className="grid gap-5 md:grid-cols-3">

            <SummaryCard
              title="Waiting"
              value={waiting}
              icon="hourglass_top"
            />

            <SummaryCard
              title="In Consultation"
              value={inConsultation}
              icon="person"
            />

            <SummaryCard
              title="Completed"
              value={completed}
              icon="check_circle"
            />

          </div>

          {/* QUEUE */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">

            {/* CURRENT QUEUE */}
            <div className="rounded-2xl border border-outline-variant bg-surface p-6">

              <p className="text-sm font-medium text-primary">
                Today's Queue
              </p>

              <h2 className="mt-1 text-2xl font-bold text-on-surface">
                OPD
              </h2>

              <div className="mt-7">

                <p className="text-sm text-on-surface-variant">
                  Patients waiting
                </p>

                <p className="mt-2 text-5xl font-bold text-on-surface">
                  {waiting}
                </p>

              </div>

              <div className="mt-7 rounded-2xl bg-gray-100 p-5">

                <p className="text-sm font-medium text-on-surface-variant">
                  Current consultation
                </p>

                <p className="mt-2 text-xl font-bold text-on-surface">
                  Patient B
                </p>

                <p className="mt-1 text-sm text-on-surface-variant">
                  General Medicine
                </p>

              </div>

            </div>

            {/* APPOINTMENT LIST */}
            <div className="rounded-2xl border border-outline-variant bg-surface p-6">

              <h2 className="text-lg font-bold text-on-surface">
                Today's Appointments
              </h2>

              <div className="mt-5 space-y-3">

                {APPOINTMENTS.map((appointment) => (
                  <div
                    key={`${appointment.time}-${appointment.patient}`}
                    className="flex flex-col gap-4 rounded-xl border border-outline-variant p-4 md:flex-row md:items-center md:justify-between"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-primary">

                        <span className="material-symbols-outlined">
                          schedule
                        </span>

                      </div>

                      <div>

                        <p className="font-bold text-on-surface">
                          {appointment.patient}
                        </p>

                        <p className="text-sm text-on-surface-variant">
                          {appointment.time} · {appointment.service}
                        </p>

                        <p className="mt-1 text-xs text-on-surface-variant">
                          {appointment.facility}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                        appointment.status,
                      )}`}
                    >
                      {appointment.status}
                    </span>

                  </div>
                ))}

              </div>

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
}

function SummaryCard({
  title,
  value,
  icon,
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

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-primary">

          <span className="material-symbols-outlined">
            {icon}
          </span>

        </div>

      </div>

    </div>
  );
}