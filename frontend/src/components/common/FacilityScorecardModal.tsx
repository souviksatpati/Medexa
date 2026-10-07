import React from "react";

export interface FacilityScorecardData {
  facilityId: string;
  facilityName: string;
  tier: "District Hospital" | "Regional Hospital" | "Block CHC" | "Block PHC";
  block: string;
  district: string;
  totalBeds: number;
  occupiedBeds: number;
  icuBeds: number;
  icuOccupied: number;
  ventilatorsAvailable: number;
  doctorCount: number;
  nurseCount: number;
  ambulanceStationed: number;
  bloodBankStock: "Adequate" | "Moderate" | "Critical Shortage";
  oxygenSupplyPercent: number;
  essentialDrugsAvailabilityPercent: number;
  nqasScorePercent: number;
  medicalSuperintendent: string;
  phone: string;
}

interface FacilityScorecardModalProps {
  facility: FacilityScorecardData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FacilityScorecardModal: React.FC<FacilityScorecardModalProps> = ({
  facility,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !facility) return null;

  const occupancyRate = Math.round((facility.occupiedBeds / facility.totalBeds) * 100);
  const icuRate = Math.round((facility.icuOccupied / facility.icuBeds) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-outline-variant bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-800 text-white font-black text-xl">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-on-surface">
                  {facility.facilityName}
                </h3>
                <span className="rounded-full bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold">
                  {facility.tier}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                ID: {facility.facilityId} • {facility.block}, {facility.district}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Capacity Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-outline-variant bg-surface p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">General Bed Occupancy</span>
              <p className="text-xl font-black text-slate-800 mt-1">{occupancyRate}%</p>
              <p className="text-[10px] text-slate-500">{facility.occupiedBeds}/{facility.totalBeds} Beds</p>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">ICU Critical Occupancy</span>
              <p className={`text-xl font-black mt-1 ${icuRate > 80 ? "text-rose-600" : "text-slate-800"}`}>
                {icuRate}%
              </p>
              <p className="text-[10px] text-slate-500">{facility.icuOccupied}/{facility.icuBeds} Beds</p>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Ventilators Free</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{facility.ventilatorsAvailable}</p>
              <p className="text-[10px] text-slate-500">Ready for admission</p>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Ambulances Stationed</span>
              <p className="text-xl font-black text-slate-800 mt-1">{facility.ambulanceStationed}</p>
              <p className="text-[10px] text-slate-500">108 Fleet Units</p>
            </div>
          </div>

          {/* Quality & Preparedness Index */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-teal-700">verified</span>
              National Quality Assurance Standards (NQAS) Readiness
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-teal-200">
                <span className="text-[11px] text-slate-500">Essential Medicines:</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{facility.essentialDrugsAvailabilityPercent}% Stocked</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-teal-200">
                <span className="text-[11px] text-slate-500">Oxygen Generator Pressure:</span>
                <p className="text-base font-bold text-emerald-700 mt-0.5">{facility.oxygenSupplyPercent}% Normal</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-teal-200">
                <span className="text-[11px] text-slate-500">Blood Bank Reserve:</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{facility.bloodBankStock}</p>
              </div>
            </div>
          </div>

          {/* Medical Officer Contact */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-on-surface text-sm">Medical Officer in Charge: {facility.medicalSuperintendent}</p>
              <p className="text-on-surface-variant">Duty Phone: <strong className="font-mono text-primary">{facility.phone}</strong></p>
            </div>

            <a
              href={`tel:${facility.phone}`}
              className="rounded-xl bg-teal-700 text-white px-4 py-2 font-bold hover:bg-teal-600 transition inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              Direct Hotline
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-outline-variant bg-surface-container-low px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant bg-surface px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
          >
            Close Scorecard
          </button>
        </div>
      </div>
    </div>
  );
};
