import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReferralAuth } from "@/sync/referralAuth";
import { AshaAuthModal } from "@/components/referral/AshaAuthModal";
import { BlockOfficeAuthModal } from "@/components/referral/BlockOfficeAuthModal";

interface CreateReferralChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption?: (type: "asha" | "block") => void;
}

export function CreateReferralChoiceModal({
  isOpen,
  onClose,
  onSelectOption,
}: CreateReferralChoiceModalProps) {
  const navigate = useNavigate();
  const { isAshaAuthenticated, isBlockOfficerAuthenticated } = useReferralAuth();

  const [ashaAuthOpen, setAshaAuthOpen] = useState(false);
  const [blockAuthOpen, setBlockAuthOpen] = useState(false);

  if (!isOpen) return null;

  const hasAsha = isAshaAuthenticated();
  const hasBlock = isBlockOfficerAuthenticated();

  const handleSelectAsha = () => {
    if (!hasAsha) {
      setAshaAuthOpen(true);
      return;
    }
    onClose();
    if (onSelectOption) {
      onSelectOption("asha");
    } else {
      navigate("/dashboard/referrals/asha?create=true");
    }
  };

  const handleSelectBlock = () => {
    if (!hasBlock) {
      setBlockAuthOpen(true);
      return;
    }
    onClose();
    if (onSelectOption) {
      onSelectOption("block");
    } else {
      navigate("/dashboard/referrals/block-office?create=true");
    }
  };

  const handleAshaAuthSuccess = () => {
    setAshaAuthOpen(false);
    onClose();
    if (onSelectOption) {
      onSelectOption("asha");
    } else {
      navigate("/dashboard/referrals/asha?create=true");
    }
  };

  const handleBlockAuthSuccess = () => {
    setBlockAuthOpen(false);
    onClose();
    if (onSelectOption) {
      onSelectOption("block");
    } else {
      navigate("/dashboard/referrals/block-office?create=true");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl border border-outline-variant bg-surface p-6 md:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
                <span className="material-symbols-outlined text-2xl">add_circle</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Create Referral</h2>
                <p className="text-xs text-on-surface-variant">
                  Select referral pathway
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Strictly Two Options: 1. ASHA Referral | 2. Block Office Referral */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Option 1: ASHA Referral */}
            <button
              type="button"
              onClick={handleSelectAsha}
              className="group flex flex-col justify-between rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-surface p-5 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                  </div>
                  {hasAsha ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-800">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      ASHA Auth
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-base font-bold text-on-surface group-hover:text-primary">
                  1. ASHA Referral
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant line-clamp-3">
                  Village frontline patient referral <strong>To Block Office</strong> (PHC / CHC).
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-outline-variant flex items-center justify-between text-xs font-bold text-primary">
                <span>{hasAsha ? "Create ASHA Referral" : "Login as ASHA Worker"}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </button>

            {/* Option 2: Block Office Referral */}
            <button
              type="button"
              onClick={handleSelectBlock}
              className="group flex flex-col justify-between rounded-2xl border border-indigo-300 bg-gradient-to-br from-indigo-50/40 via-surface to-surface p-5 text-left transition hover:-translate-y-1 hover:border-indigo-600 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800">
                    <span className="material-symbols-outlined text-2xl">domain</span>
                  </div>
                  {hasBlock ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-800">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-800">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      Officer Auth
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-base font-bold text-on-surface group-hover:text-indigo-800">
                  2. Block Office Referral
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant line-clamp-3">
                  Block Health Office referral / escalation <strong>To District Office</strong>.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-outline-variant flex items-center justify-between text-xs font-bold text-indigo-800">
                <span>{hasBlock ? "Create Block Referral" : "Login as Block Officer"}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated ASHA Authentication Modal */}
      <AshaAuthModal
        isOpen={ashaAuthOpen}
        onClose={() => setAshaAuthOpen(false)}
        onSuccess={handleAshaAuthSuccess}
      />

      {/* Dedicated Block Office Authentication Modal */}
      <BlockOfficeAuthModal
        isOpen={blockAuthOpen}
        onClose={() => setBlockAuthOpen(false)}
        onSuccess={handleBlockAuthSuccess}
      />
    </>
  );
}
