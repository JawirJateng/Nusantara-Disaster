/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* ------------------------------------------------------------------
         Nusantara Disaster design tokens — forest / sage / mint palette
         Source: DESAIN.md §2
      ------------------------------------------------------------------ */
      colors: {
        // --- Core forest scale (reference hexes) ---
        forest: {
          50:   "#EDF3F0",
          100:  "#D4E6DF",
          200:  "#B3D1C4",
          300:  "#8FAF98",
          400:  "#5F8C7A",
          500:  "#467363",
          600:  "#335B51",
          700:  "#235347", // primary button, active links, accent
          800:  "#163832", // active nav, dark panels
          900:  "#0B2B26", // dark header, secondary dark surface
          950:  "#051F20", // very dark bg, sidebar, footer
        },
        // --- Soft sage accent scale ---
        sage: {
          100:  "#D7E8DC",
          300:  "#A8C4AE",
          400:  "#8EB69B", // soft accent, active borders, secondary icons
          500:  "#6E937D",
          600:  "#4F725F",
          700:  "#3A5746",
        },
        // --- Light mint highlight scale ---
        mint: {
          50:   "#F0FBF3",
          100:  "#DAF1DE", // soft surface, highlight
          200:  "#B8EACB",
          300:  "#91DDB8",
          400:  "#5BBF9A",
          500:  "#3FA079",
        },
        // --- Neutral surface / ink / line ---
        ink:       "#172522",        // primary text
        "ink-muted": "#60716A",     // secondary text
        surface:   "#FFFFFF",       // content surface
        "surface-muted": "#EDF3F0", // disabled / subtle tint
        canvas:    "#F7FAF7",       // page background
        line:      "#E2EAE4",       // default border
        "line-soft": "#DDE7E1",     // subtle separator
        // --- Semantic status ---
        danger:    "#C43D3D",
        warning:   "#C58A28",
        info:      "#3478A5",
        success:   "#2F7658",
        // --- Legacy aliases used by existing components (map to sage) ---
        lime:        "#8EB69B",
        "lime-strong": "#6E937D",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1:    ["2rem",      { fontWeight: "700", lineHeight: "1.1"  }], // 32px page title
        h2:    ["1.375rem",  { fontWeight: "600", lineHeight: "1.2"  }], // 22px section title
        h3:    ["1.125rem",  { fontWeight: "600", lineHeight: "1.3"  }], // 18px card title
        body:  ["1rem",      { lineHeight: "1.5" }],
        "body-sm": ["0.875rem", { lineHeight: "1.4" }],
        small: ["0.75rem",   { lineHeight: "1.3" }],
        kpi:   ["2.25rem",   { fontWeight: "700", lineHeight: "1"   }], // 36px KPI
      },
      borderRadius: {
        card:    "1rem",     // 14-18px cards
        dialog:  "1rem",
        button:  "0.75rem",  // 9-12px buttons/inputs
        input:   "0.75rem",
        pill:    "9999px",   // badges
        lg:      "var(--radius)",
        md:      "calc(var(--radius) - 2px)",
        sm:      "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(5,31,32,0.1), 0 2px 4px -1px rgba(5,31,32,0.06)",
        "card-hover": "0 10px 15px -3px rgba(5,31,32,0.1), 0 4px 6px -2px rgba(5,31,32,0.05)",
        floating: "0 20px 40px rgba(5,31,32,0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slow-pulse": {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slow-pulse": "slow-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}