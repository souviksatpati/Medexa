import { useState } from "react";
import { useReferralAuth } from "@/sync/referralAuth";

interface BlockOfficeAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BlockOfficeAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: BlockOfficeAuthModalProps) {
  const { verifyAndLogin, blockOfficerUser } = useReferralAuth();
  const [officerId, setOfficerId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!officerId.trim()) {
      setError("Please enter your Block Officer ID or Name");
      return;
    }
    if (!pin.trim()) {
      setError("Please enter your Security PIN");
      return;
    }

    const res = await verifyAndLogin(officerId, pin, "block_officer");
    if (!res.success) {
      setError(res.error || "Authentication failed. Invalid database credentials.");
      return;
    }

    onSuccess?.();
    onClose();
  };

  const handleSelectRegisteredOfficer = async (id: string, codePin: string) => {
    setOfficerId(id);
    setPin(codePin);
    setError(null);
    const res = await verifyAndLogin(id, codePin, "block_officer");
    if (res.success) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
              <span className="material-symbols-outlined text-2xl">domain</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">CHC Medical Officer Authentication</h2>
              <p className="text-xs text-on-surface-variant">
                Community Health Centre & PHC Administration database verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {blockOfficerUser && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs flex items-center justify-between">
            <span className="text-on-surface-variant">Active CHC Officer:</span>
            <span className="font-bold text-indigo-900">{blockOfficerUser.name} ({blockOfficerUser.id})</span>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start gap-2">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              CHC Medical Officer ID or Name (MOIC / BMOH) *
            </label>
            <input
              type="text"
              required
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              placeholder="e.g. BHO-WB-204 or Dr. Anirban Roy"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Officer Security PIN (4-digit) *
            </label>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4-digit PIN"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 font-mono tracking-widest"
            />
            <p className="mt-1 text-[11px] text-on-surface-variant">
              Registered database PIN is: <strong className="text-indigo-800 font-mono">4321</strong>
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-700 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-800"
            >
              Verify with Database & Enter
            </button>
          </div>
        </form>

        {/* Database Quick Authenticate Buttons */}
        <div className="mt-5 border-t border-outline-variant pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Registered CHC Officers (Click to Authenticate):
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleSelectRegisteredOfficer("BHO-WB-204", "4321")}
              className="w-full text-left rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-xs hover:bg-indigo-100/70 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-indigo-900">Dr. Anirban Roy</span>
                <span className="text-on-surface-variant ml-1.5">(BHO-WB-204 • Belur PHC / CHC)</span>
              </div>
              <span className="font-mono text-[11px] text-indigo-800 font-bold">PIN: 4321</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRegisteredOfficer("BHO-WB-205", "4321")}
              className="w-full text-left rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs hover:bg-surface-container flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-on-surface">Dr. P. Mukherjee</span>
                <span className="text-on-surface-variant ml-1.5">(BHO-WB-205 • Joypur CHC)</span>
              </div>
              <span className="font-mono text-[11px] text-on-surface-variant">PIN: 4321</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
