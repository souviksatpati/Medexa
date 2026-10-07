import { AshaAuthModal } from "@/components/referral/AshaAuthModal";
import { BlockOfficeAuthModal } from "@/components/referral/BlockOfficeAuthModal";

interface ReferralAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole?: "asha" | "rural_officer" | "block";
  onSuccess?: () => void;
}

export function ReferralAuthModal({
  isOpen,
  onClose,
  requiredRole = "asha",
  onSuccess,
}: ReferralAuthModalProps) {
  if (requiredRole === "asha") {
    return (
      <AshaAuthModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <BlockOfficeAuthModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
