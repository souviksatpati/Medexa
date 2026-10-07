import React, { useState } from "react";
import type { PatientCase } from "../../sync/mockPatientCases";

interface EmergencyEscalationModalProps {
  patient: PatientCase | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatched?: (ticketId: string) => void;
}

export const EmergencyEscalationModal: React.FC<EmergencyEscalationModalProps> = ({
  patient,
  isOpen,
  onClose,
  onDispatched,
}) => {
  const [isDispatched, setIsDispatched] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [facility, setFacility] = useState("Bankura Sammilani Medical College & Hospital");
  const [ambulanceType, setAmbulanceType] = useState("ALS (Advanced Life Support - Defibrillator & O2)");
  const [ashaAccompanying, setAshaAccompanying] = useState(true);
  const [emergencyNotes, setEmergencyNotes] = useState(
    "Critical vital instability detected. Immediate obstetric / intensive resuscitation team pre-alert requested."
  );

  if (!isOpen || !patient) return null;

  const handleDispatch = () => {
    const generatedTicket = `108-WB-BNK-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(generatedTicket);
    setIsDispatched(true);
    onDispatched?.(generatedTicket);
  };

  const resetAndClose = () => {
    setIsDispatched(false);
    setTicketId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/80 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl border-2 border-rose-500 bg-surface shadow-2xl overflow-hidden">
        {/* Urgent Header */}
        <div className="bg-rose-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black">
              🚑
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide uppercase flex items-center gap-2">
                Emergency 108 Ambulance Dispatch
                <span className="animate-ping h-2.5 w-2.5 rounded-full bg-white inline-block"></span>
              </h3>
              <p className="text-xs text-rose-100 font-medium">
                West Bengal Swasthya Sathi Rapid Emergency Command Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-xl bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {isDispatched ? (
            /* Dispatch Confirmation State */
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl font-black">
                ✓
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  108 Emergency Ambulance Dispatched!
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  GPS telemetry broadcasted to nearest available ALS unit in Joypur-Bankura zone.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-container p-4 border border-outline-variant text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-semibold">Incident Ticket ID:</span>
                  <span className="font-mono font-bold text-primary text-sm">{ticketId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-semibold">Assigned Ambulance:</span>
                  <span className="font-bold text-slate-800">WB-68-E-4421 (ALS Unit #3)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-semibold">Estimated Arrival (ETA):</span>
                  <span className="font-bold text-rose-600">11 Minutes</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-semibold">Destination Facility:</span>
                  <span className="font-bold text-slate-800">{facility}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-semibold">Driver Contact:</span>
                  <span className="font-mono font-bold text-slate-800">+91 94321 00888</span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Dispatch Preparation State */
            <>
              {/* Critical Patient Banner */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold text-base">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-950 text-sm">{patient.name}</h4>
                      <p className="text-xs text-rose-800">
                        {patient.age}y {patient.gender} • {patient.village} • ABHA: {patient.abhaId}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                    TRIAGE RED
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-4 gap-1 rounded-xl bg-white/80 p-2 text-center text-xs border border-rose-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">BP</span>
                    <p className="font-bold text-slate-900">{patient.vitals.bp}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Pulse</span>
                    <p className="font-bold text-slate-900">{patient.vitals.pulse}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">SpO2</span>
                    <p className="font-bold text-rose-600">{patient.vitals.spo2}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Temp</span>
                    <p className="font-bold text-slate-900">{patient.vitals.temp}</p>
                  </div>
                </div>
              </div>

              {/* Form Options */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Destination Referral Hospital:
                  </label>
                  <select
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface p-2.5 text-xs font-semibold text-on-surface"
                  >
                    <option value="Bankura Sammilani Medical College & Hospital">
                      Bankura Sammilani Medical College & Hospital (Tertiary)
                    </option>
                    <option value="Belur Block PHC">
                      Belur Block Primary Health Centre (Secondary)
                    </option>
                    <option value="Bishnupur Sub-Divisional Hospital">
                      Bishnupur Sub-Divisional Hospital
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Emergency Unit Fleet Level:
                  </label>
                  <select
                    value={ambulanceType}
                    onChange={(e) => setAmbulanceType(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface p-2.5 text-xs font-semibold text-on-surface"
                  >
                    <option value="ALS (Advanced Life Support - Defibrillator & O2)">
                      ALS (Advanced Life Support - Defibrillator, Ventilator, O2)
                    </option>
                    <option value="BLS (Basic Life Support - Stretcher & O2)">
                      BLS (Basic Life Support - Stretcher & O2)
                    </option>
                    <option value="Janani Shishu Suraksha (Maternal Emergency)">
                      Janani Shishu Suraksha (Maternal Emergency Van)
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="ashaEscort"
                    checked={ashaAccompanying}
                    onChange={(e) => setAshaAccompanying(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  >
                  </input>
                  <label htmlFor="ashaEscort" className="font-medium text-slate-700 cursor-pointer">
                    ASHA Worker accompanying patient during transit
                  </label>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Pre-Arrival ER Warning Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface p-2 text-xs text-slate-700"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-xl border border-outline-variant bg-surface px-4 py-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition"
                >
                  Cancel
                </button>

                <a
                  href="tel:108"
                  className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 text-center hover:bg-rose-100 transition inline-flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  Direct Call 108
                </a>

                <button
                  type="button"
                  onClick={handleDispatch}
                  className="flex-1 rounded-xl bg-rose-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-rose-700 transition flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                  DISPATCH 108 AMBULANCE NOW
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
