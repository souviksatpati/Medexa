import React, { useState } from "react";

interface ReferralChartsProps {
  districtName?: string;
  totalReferrals?: number;
}

export const ReferralCharts: React.FC<ReferralChartsProps> = ({
  districtName = "Bankura",
  totalReferrals = 38,
}) => {
  const [activeDay, setActiveDay] = useState<number | null>(null);

  // 7-day referral trend data
  const days = [
    { day: "Mon", count: 18, emergency: 4 },
    { day: "Tue", count: 24, emergency: 6 },
    { day: "Wed", count: 29, emergency: 8 },
    { day: "Thu", count: 22, emergency: 5 },
    { day: "Fri", count: 35, emergency: 11 },
    { day: "Sat", count: 31, emergency: 9 },
    { day: "Sun", count: 26, emergency: 7 },
  ];

  const maxCount = 40;

  // Donut chart calculations
  // Red: 32%, Yellow: 46%, Green: 22%
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const redStroke = (32 / 100) * circumference;
  const yellowStroke = (46 / 100) * circumference;
  const greenStroke = (22 / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. 7-Day Referral Volume Bar Chart */}
      <div className="lg:col-span-2 rounded-3xl border border-outline-variant bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
              7-Day Referral Intake Velocity ({districtName})
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Daily frontline intake from ASHA Sub-Centres & Block PHCs
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className="h-2.5 w-2.5 rounded-sm bg-teal-600 inline-block" /> Total Volume
            </span>
            <span className="flex items-center gap-1.5 font-medium text-rose-700">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 inline-block" /> Red Flag Emergency
            </span>
          </div>
        </div>

        {/* Pure CSS/SVG Bar Visualization */}
        <div className="relative pt-4 pb-2">
          {/* Grid lines */}
          <div className="absolute inset-x-0 top-0 flex flex-col justify-between h-44 pointer-events-none opacity-20">
            <div className="border-b border-slate-400 w-full" />
            <div className="border-b border-slate-400 w-full" />
            <div className="border-b border-slate-400 w-full" />
            <div className="border-b border-slate-400 w-full" />
          </div>

          <div className="relative h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-6">
            {days.map((item, idx) => {
              const heightPercent = (item.count / maxCount) * 100;
              const emergencyPercent = (item.emergency / item.count) * 100;
              const isHovered = activeDay === idx;

              return (
                <div
                  key={item.day}
                  onMouseEnter={() => setActiveDay(idx)}
                  onMouseLeave={() => setActiveDay(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 rounded-xl bg-slate-900 text-white px-2.5 py-1 text-[11px] font-bold whitespace-nowrap shadow-lg animate-in fade-in">
                      {item.count} referrals ({item.emergency} Red)
                    </div>
                  )}

                  {/* Dual Bar Stack */}
                  <div
                    className="w-full max-w-[42px] rounded-t-xl overflow-hidden bg-teal-600/90 transition-all duration-300 group-hover:bg-teal-500 flex flex-col justify-end"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* Emergency bottom portion */}
                    <div
                      className="w-full bg-rose-500"
                      style={{ height: `${emergencyPercent}%` }}
                      title={`${item.emergency} Emergencies`}
                    />
                  </div>

                  <span className="text-xs font-bold text-on-surface-variant mt-2">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-outline-variant/60 flex flex-wrap items-center justify-between text-xs text-on-surface-variant">
          <span>Weekly Peak: <strong>Friday (35 cases)</strong></span>
          <span>Continuity Compliance Rate: <strong className="text-emerald-700 font-bold">92.4%</strong></span>
        </div>
      </div>

      {/* 2. Triage Breakdown Donut & Quality Index */}
      <div className="rounded-3xl border border-outline-variant bg-surface p-5 sm:p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">donut_large</span>
            Triage Severity Ratio
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Active caseload split across clinical acuity
          </p>

          {/* SVG Donut */}
          <div className="relative my-4 flex items-center justify-center">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-100"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />

              {/* Red Segment (32%) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#e11d48"
                strokeWidth="12"
                strokeDasharray={`${redStroke} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500"
              />

              {/* Yellow Segment (46%) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#d97706"
                strokeWidth="12"
                strokeDasharray={`${yellowStroke} ${circumference}`}
                strokeDashoffset={`-${redStroke}`}
                fill="transparent"
                className="transition-all duration-500"
              />

              {/* Green Segment (22%) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#059669"
                strokeWidth="12"
                strokeDasharray={`${greenStroke} ${circumference}`}
                strokeDashoffset={`-${redStroke + yellowStroke}`}
                fill="transparent"
                className="transition-all duration-500"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-on-surface">{totalReferrals}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Active</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-600 inline-block" />
                Red / Critical Emergency
              </span>
              <span className="font-bold text-rose-700">32%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                Yellow / High Priority
              </span>
              <span className="font-bold text-amber-700">46%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-800">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
                Green / Routine Care
              </span>
              <span className="font-bold text-emerald-700">22%</span>
            </div>
          </div>
        </div>

        {/* Quality Metric Pill */}
        <div className="mt-4 pt-3 border-t border-outline-variant/60 rounded-xl bg-teal-50 border border-teal-200 p-2.5 text-center">
          <span className="text-[10px] uppercase font-bold text-teal-800">Average Transit to Admission</span>
          <p className="text-base font-black text-teal-950 mt-0.5">3.2 Hours <span className="text-xs text-emerald-700 font-normal">(-45m vs target)</span></p>
        </div>
      </div>
    </div>
  );
};
