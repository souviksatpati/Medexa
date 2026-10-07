import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { LanguageSelector } from "./LanguageSelector";
import { PortalChooserModal } from "./PortalChooserModal";
import { useLanguageStore } from "@/i18n/useLanguageStore";

export function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguageStore();

  // Close mobile drawer when route changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="relative z-30 border-b border-outline-variant/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-3.5 sm:px-6 md:h-[80px] md:px-8">

          {/* BRAND LOGO */}
          <Link to="/" className="flex items-center shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <BrandMark showSubtitle={true} />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                location.pathname === "/"
                  ? "text-primary font-bold bg-primary/10"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-slate-100"
              }`}
            >
              {t("header", "home")}
            </Link>

            <button
              type="button"
              onClick={() => setPortalModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-slate-100 transition"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">apps</span>
              <span>Portals</span>
            </button>
          </nav>

          {/* HEADER RIGHT CONTROLS */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            {/* DIRECT COMPACT LANGUAGE SELECTOR (🌐 EN ▾) */}
            <LanguageSelector />

            {/* STAFF PORTAL PRIMARY CTA */}
            <button
              type="button"
              onClick={() => setPortalModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm transition hover:bg-primary-hover active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                login
              </span>
              <span>Staff Portal</span>
            </button>

            {/* MOBILE HAMBURGER BUTTON (Visible on < 768px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t("header", "closeMenu") : t("header", "openMenu")}
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface transition hover:bg-slate-100 active:scale-95 md:hidden"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER / BACKDROP */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[72px] z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
            <div
              className="absolute inset-x-0 top-0 max-h-[calc(100vh-72px)] overflow-y-auto bg-surface border-b border-outline-variant p-5 shadow-2xl animate-in slide-in-from-top-4 duration-200"
            >
              <div className="space-y-2">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 rounded-2xl p-3.5 text-base font-semibold text-primary bg-primary/10"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                    <span className="material-symbols-outlined text-[20px]">home</span>
                  </span>
                  <span>{t("header", "home")}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPortalModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3.5 rounded-2xl p-3.5 text-base font-semibold text-on-surface hover:bg-slate-100 transition"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">apps</span>
                  </span>
                  <span>Role Portals (ASHA / Block / District)</span>
                </button>
              </div>

              {/* Bottom Actions in Drawer */}
              <div className="mt-6 pt-5 border-t border-outline-variant space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPortalModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-on-primary shadow transition hover:opacity-95"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                  <span>Open Staff Portal</span>
                </button>

                {t("footer", "copyright") ? (
                  <p className="text-center text-xs text-on-surface-variant">
                    {t("footer", "copyright")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Role Portal Chooser Modal */}
      <PortalChooserModal
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
      />
    </>
  );
}
