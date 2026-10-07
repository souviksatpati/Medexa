import { useState } from "react";
import { useReferralAuth } from "@/sync/referralAuth";

interface AshaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AshaAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: AshaAuthModalProps) {
  const { verifyAndLogin, ashaUser } = useReferralAuth();
  const [workerId, setWorkerId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!workerId.trim()) {
      setError("Please enter your ASHA Worker Registration ID or Name");
      return;
    }
    if (!pin.trim()) {
      setError("Please enter your Security PIN");
      return;
    }

    const res = await verifyAndLogin(workerId, pin, "asha");
    if (!res.success) {
      setError(res.error || "Authentication failed. Invalid database credentials.");
      return;
    }

    onSuccess?.();
    onClose();
  };

  const handleSelectRegisteredWorker = async (id: string, codePin: string) => {
    setWorkerId(id);
    setPin(codePin);
    setError(null);
    const res = await verifyAndLogin(id, codePin, "asha");
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">ASHA Worker Authentication</h2>
              <p className="text-xs text-on-surface-variant">
                Frontline village health worker database verification
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

        {ashaUser && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs flex items-center justify-between">
            <span className="text-on-surface-variant">Active ASHA Session:</span>
            <span className="font-bold text-primary">{ashaUser.name} ({ashaUser.id})</span>
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
              ASHA Worker Registration ID or Name *
            </label>
            <input
              type="text"
              required
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              placeholder="e.g. ASHA-WB-401 or Kavita Roy"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              ASHA Security PIN (4-digit) *
            </label>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="4-digit PIN"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary font-mono tracking-widest"
            />
            <p className="mt-1 text-[11px] text-on-surface-variant">
              Registered database PIN is: <strong className="text-primary font-mono">1234</strong>
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-on-primary shadow-sm hover:opacity-90"
            >
              Verify with Database & Enter
            </button>
          </div>
        </form>

        {/* Database Quick Authenticate Buttons */}
        <div className="mt-5 border-t border-outline-variant pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Registered Database Workers (Click to Authenticate):
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleSelectRegisteredWorker("ASHA-WB-401", "1234")}
              className="w-full text-left rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs hover:bg-primary/10 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-primary">Kavita Roy</span>
                <span className="text-on-surface-variant ml-1.5">(ASHA-WB-401 • Rampur Village)</span>
              </div>
              <span className="font-mono text-[11px] text-primary font-bold">PIN: 1234</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRegisteredWorker("ASHA-WB-402", "1234")}
              className="w-full text-left rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-xs hover:bg-surface-container flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-on-surface">Radha Sen</span>
                <span className="text-on-surface-variant ml-1.5">(ASHA-WB-402 • Sonamukhi)</span>
              </div>
              <span className="font-mono text-[11px] text-on-surface-variant">PIN: 1234</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
