interface BrandMarkProps {
  showSubtitle?: boolean;
}

export function BrandMark({ showSubtitle = true }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-primary text-on-primary shadow-sm">
        <span className="material-symbols-outlined filled text-[20px] sm:text-[24px]">
          medical_services
        </span>
      </div>

      <div className="min-w-0">
        <div className="text-lg sm:text-xl font-bold tracking-tight text-primary leading-tight">
          Medexa
        </div>

        {showSubtitle && (
          <div className="hidden min-[380px]:block text-[11px] sm:text-xs font-medium text-on-surface-variant leading-tight">
            Continuity of Care
          </div>
        )}
      </div>
    </div>
  );
}