import { useState, useRef, useEffect } from "react";
import { useLanguageStore } from "@/i18n/useLanguageStore";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n/languages";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, getLanguageInfo } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = getLanguageInfo();

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* TRIGGER BUTTON (Directly in header) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-full border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface shadow-xs transition hover:border-primary hover:bg-slate-50 active:scale-95 sm:px-3.5 sm:py-2 sm:text-sm"
        title="Select Language / भाषा चुनें"
      >
        <span className="text-base leading-none">🌐</span>
        <span className="font-bold tracking-wide">
          {current.shortCode}
        </span>
        <span
          className={`material-symbols-outlined text-[16px] text-on-surface-variant transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-[280px] rounded-2xl border border-outline-variant bg-white p-2 shadow-2xl ring-1 ring-black/10 animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/60 px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span>🌐</span> Choose Language
            </span>
            <span className="text-[10px] text-primary font-semibold">12 Languages</span>
          </div>

          {/* Language Options List */}
          <div className="mt-1 max-h-[240px] overflow-y-auto overscroll-contain py-1 space-y-0.5 scrollbar-thin">
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item.code)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                    isSelected
                      ? "bg-primary text-on-primary font-bold shadow-xs"
                      : "text-on-surface hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                        isSelected
                          ? "bg-on-primary/20 text-on-primary"
                          : "bg-slate-100 text-on-surface-variant"
                      }`}
                    >
                      {item.shortCode}
                    </span>

                    <div className="truncate">
                      <p className="text-sm font-semibold leading-tight">
                        {item.nativeName}
                      </p>
                      <p
                        className={`text-[11px] leading-tight ${
                          isSelected ? "text-on-primary/85" : "text-on-surface-variant"
                        }`}
                      >
                        {item.name}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="material-symbols-outlined shrink-0 text-[18px]">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
