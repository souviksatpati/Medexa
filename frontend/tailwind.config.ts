import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/**
 * These tokens are extracted directly from the four Google Stitch screens
 * (Digital Triage Form, Referral Tracker, Facility Continuity Table,
 * Continuity Overview) so the implemented app matches the approved
 * design 1:1 rather than being eyeballed. If Stitch output changes,
 * update this file — don't hand-tune colors elsewhere.
 *
 * Material 3 naming convention (surface/on-surface/container/etc.) is
 * used throughout; see MEDEXA_CANONICAL_PROJECT_CONTEXT.md for the
 * product terminology these tokens support (clinical risk vs continuity
 * risk get different accent treatment — see globals.css for the mapping).
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        "surface-variant": "#e0e3e1",
        "primary-fixed": "#9cf2e8",
        "surface-container-high": "#e5e9e7",
        "on-background": "#181c1c",
        error: "#ba1a1a",
        "secondary-fixed-dim": "#b7c8e1",
        tertiary: "#7f4025",
        outline: "#6e7977",
        "on-surface": "#181c1c",
        "secondary-container": "#d0e1fb",
        primary: "#005c55",
        "inverse-primary": "#80d5cb",
        "on-primary-container": "#a3faef",
        "primary-container": "#0f766e",
        "surface-bright": "#f7faf8",
        "on-secondary-fixed": "#0b1c30",
        surface: "#f7faf8",
        "on-primary": "#ffffff",
        "on-secondary-container": "#54647a",
        "on-tertiary-container": "#ffe5db",
        "tertiary-fixed-dim": "#ffb598",
        "on-tertiary-fixed": "#370e00",
        "tertiary-fixed": "#ffdbce",
        "primary-fixed-dim": "#80d5cb",
        "on-error-container": "#93000a",
        "surface-tint": "#006a63",
        secondary: "#505f76",
        "surface-container-highest": "#e0e3e1",
        "on-surface-variant": "#3e4947",
        "tertiary-container": "#9c573a",
        "on-tertiary-fixed-variant": "#72361b",
        "surface-dim": "#d7dbd9",
        "inverse-surface": "#2d3130",
        "on-secondary-fixed-variant": "#38485d",
        "secondary-fixed": "#d3e4fe",
        background: "#f7faf8",
        "outline-variant": "#bdc9c6",
        "inverse-on-surface": "#eef1f0",
        "surface-container-low": "#f1f4f3",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#ebefed",
        "on-primary-fixed": "#00201d",
        "on-secondary": "#ffffff",
        "on-primary-fixed-variant": "#00504a",

        "amber-accent": "#d97706",
        "red-accent": "#dc2626",
        "green-accent": "#16a34a",
      },

      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
        card: "12px",
      },

      spacing: {
        sm: "8px",
        xs: "4px",
        "tap-target-min": "48px",
        md: "16px",
        lg: "24px",
        gutter: "24px",
        unit: "4px",
        "container-margin-desktop": "64px",
        xl: "40px",
        "container-margin-mobile": "16px",
      },

      fontFamily: {
        "label-sm": ["Atkinson Hyperlegible Next", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "label-lg": ["Atkinson Hyperlegible Next", "sans-serif"],
        "body-lg": ["Atkinson Hyperlegible Next", "sans-serif"],
        "headline-md-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Atkinson Hyperlegible Next", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-sm": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg-mobile": ["Atkinson Hyperlegible Next", "sans-serif"],
      },

      fontSize: {
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "label-lg": [
          "14px",
          {
            lineHeight: "20px",
            letterSpacing: "0.02em",
            fontWeight: "600",
          },
        ],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-md-mobile": [
          "22px",
          { lineHeight: "28px", fontWeight: "600" },
        ],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "display-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg-mobile": [
          "18px",
          { lineHeight: "26px", fontWeight: "500" },
        ],
      },

      boxShadow: {
        ambient: "0 4px 12px rgba(0, 0, 0, 0.04)",
        elevated: "0 12px 24px rgba(0, 0, 0, 0.08)",
      },
    },
  },

  plugins: [forms, containerQueries],
} satisfies Config;
