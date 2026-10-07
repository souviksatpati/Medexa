import React, { useState } from "react";
import type { PatientCase } from "../../sync/mockPatientCases";

interface TeleconsultationModalProps {
  patient: PatientCase | null;
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionSaved?: (notes: string, rxList: string[]) => void;
}

export const TeleconsultationModal: React.FC<TeleconsultationModalProps> = ({
  patient,
  isOpen,
  onClose,
  onPrescriptionSaved,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState(
    "Patient presenting with gestational hypertension. Fetal heart sounds normal (142 bpm). Advised strict bed rest, reduced sodium, and urgent ultrasound at Block PHC tomorrow."
  );
  const [rxList, setRxList] = useState<string[]>([
    "Tab Labetalol 100mg - 1 tablet twice daily",
    "Tab Calcium 500mg - 1 tablet daily",
    "Weekly BP log to be submitted by ASHA",
  ]);
  const [newRx, setNewRx] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [callDuration, setCallDuration] = useState(247); // seconds

  React.useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAddRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRx.trim()) return;
    setRxList([...rxList, newRx.trim()]);
    setNewRx("");
  };

  const handleRemoveRx = (index: number) => {
    setRxList(rxList.filter((_, i) => i !== index));
  };

  const handleSaveAndEnd = () => {
    setSavedSuccess(true);
    onPrescriptionSaved?.(doctorNotes, rxList);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-outline-variant bg-slate-900 text-white shadow-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Tele-EHR Assisted Consult: {patient.name}
                <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 text-[11px] font-mono text-teal-300">
                  {formatDuration(callDuration)}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dr. Anirban Roy (BMOH) ↔ ASHA {patient.assignedAsha} ({patient.village})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLowBandwidth(!isLowBandwidth)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                isLowBandwidth
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Toggle low-bandwidth optimization (reduces bitrate for 2G/3G connectivity)"
            >
              <span className="material-symbols-outlined text-[15px]">signal_cellular_alt</span>
              <span>{isLowBandwidth ? "2G Low-Bitrate ON" : "Optimize for 2G"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Modal Main Area: Video Feed (Left) & Clinical Consult Pad (Right) */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Video Consult Canvas */}
          <div className="relative flex-1 bg-slate-950 flex flex-col justify-between p-4 min-h-[300px]">
            {/* Top Overlay Badge */}
            <div className="flex items-center justify-between text-xs">
              <span className="rounded-md bg-black/60 px-2.5 py-1 backdrop-blur-sm text-slate-300 font-mono flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {isLowBandwidth ? "VoIP Audio + Slide (64kbps)" : "WebRTC Encrypted (HD 720p)"}
              </span>
              <span className="rounded-md bg-black/60 px-2.5 py-1 backdrop-blur-sm text-slate-300">
                ABHA ID: {patient.abhaId}
              </span>
            </div>

            {/* Simulated Remote Doctor Screen */}
            <div className="my-auto flex flex-col items-center justify-center text-center">
              <div className="relative mb-3 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-tr from-teal-700 to-indigo-700 text-white font-bold text-3xl shadow-lg ring-4 ring-teal-500/30">
                DR
                <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center text-[10px]">
                  ✓
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">Dr. Anirban Roy</h3>
              <p className="text-xs text-teal-300">Block Medical Officer of Health (BMOH)</p>
              <p className="mt-1 text-[11px] text-slate-400 max-w-sm">
                Joypur Block Primary Health Centre • Medical Council Reg: WBMC/84920
              </p>
            </div>

            {/* Local Picture-in-Picture (ASHA + Patient) */}
            <div className="absolute bottom-16 right-4 h-28 w-40 sm:h-32 sm:w-48 overflow-hidden rounded-2xl border-2 border-teal-500/60 bg-slate-900 shadow-xl">
              <div className="flex h-full w-full flex-col items-center justify-center bg-slate-800 text-center p-2">
                <span className="material-symbols-outlined text-2xl text-teal-400">group</span>
                <p className="text-xs font-bold text-white mt-1">{patient.name}</p>
                <p className="text-[10px] text-teal-300 font-medium">with ASHA {patient.assignedAsha.split(" ")[0]}</p>
                <span className="mt-1 text-[9px] text-slate-400 font-mono">Camera Active</span>
              </div>
            </div>

            {/* In-Call Controls Bar */}
            <div className="z-10 mx-auto flex items-center gap-3 rounded-2xl bg-slate-900/90 px-4 py-2 border border-slate-800 backdrop-blur-md shadow-lg">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  isMuted ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <span className="material-symbols-outlined text-lg">
                  {isMuted ? "mic_off" : "mic"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  isVideoOff ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              >
                <span className="material-symbols-outlined text-lg">
                  {isVideoOff ? "videocam_off" : "videocam"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndEnd}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                <span className="material-symbols-outlined text-base">call_end</span>
                <span>End Call</span>
              </button>
            </div>
          </div>

          {/* Right Consultation & Digital Prescription Sheet */}
          <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 p-4 sm:p-5 overflow-y-auto">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-base">prescriptions</span>
              Consultation & e-Prescription
            </h3>

            {/* Quick Vitals Ribbon */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-800/80 p-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">BP</span>
                <p className="font-bold text-white">{patient.vitals.bp}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Pulse</span>
                <p className="font-bold text-white">{patient.vitals.pulse}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">SpO2</span>
                <p className="font-bold text-teal-400">{patient.vitals.spo2}</p>
              </div>
            </div>

            {/* Doctor Clinical Advice */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Medical Officer Advisory / Findings:
              </label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                placeholder="Type doctor's instructions for ASHA and patient..."
              />
            </div>

            {/* Digital Prescription Items */}
            <div className="mt-4 flex-1 space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Prescribed Medications ({rxList.length})</span>
                <span className="text-[10px] text-teal-400 font-normal">e-Sign Approved</span>
              </label>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {rxList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <span className="truncate pr-2">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRx(idx)}
                      className="text-slate-400 hover:text-rose-400 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Prescription form */}
              <form onSubmit={handleAddRx} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newRx}
                  onChange={(e) => setNewRx(e.target.value)}
                  placeholder="e.g. Tab IFA 100mg once daily..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-500"
                >
                  + Add
                </button>
              </form>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleSaveAndEnd}
                disabled={savedSuccess}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-500 transition"
              >
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                <span>{savedSuccess ? "Prescription Issued & Syncing..." : "Save & Transmit e-Prescription"}</span>
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Prescription signed digitally & queued for offline synchronization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
