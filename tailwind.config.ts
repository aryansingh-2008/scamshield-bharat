import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Institutional Financial-Regulatory Safety Palette
        console: {
          950: "#F7F8FA", // Background canvas (#F7F8FA)
          900: "#FFFFFF", // Surface / card panel (#FFFFFF)
          850: "#F2F5F8", // Soft surface / input wells (#F2F5F8)
          800: "#E9EEF3", // Active toggle backgrounds / hover wells
          750: "#E0E6ED",
          700: "#D8DEE5", // Structural neutral borders (#D8DEE5)
          600: "#C2CCD6", // Border hover / interactive
          500: "#98A2B3", // Muted placeholders
          400: "#667085", // Secondary text (#667085)
          300: "#475467", // Body text (#475467)
          200: "#344054", // Dark body text
          100: "#17202A", // Heading text & primary dark content (#17202A)
          50: "#0B1017",  // Max contrast text
        },
        // Safety Status Colors (Semantic Indian Financial Standards)
        safety: {
          high: {
            bg: "#FEF2F2", // soft red-50
            surface: "#FFFFFF",
            border: "#FECACA", // red-200
            text: "#B42318", // High Risk (#B42318)
            badge: "#B42318",
            accent: "#B42318",
          },
          warning: {
            bg: "#FFFBEB", // soft amber-50
            surface: "#FFFFFF",
            border: "#FDE68A", // amber-200
            text: "#B54708", // Warning / Uncertainty (#B54708)
            badge: "#B54708",
            accent: "#B54708",
          },
          safe: {
            bg: "#F0FDF4", // soft emerald-50
            surface: "#FFFFFF",
            border: "#BBF7D0", // emerald-200
            text: "#087A5B", // Verified / Safe (#087A5B)
            badge: "#087A5B",
            accent: "#087A5B",
          },
          neutral: {
            bg: "#F8FAFC",
            surface: "#FFFFFF",
            border: "#D8DEE5",
            text: "#334155",
            badge: "#64748B",
            accent: "#64748B",
          },
          brand: {
            primary: "#164E78", // Primary Financial Blue Button / CTA (#164E78)
            secondary: "#0F3B5C", // Primary Button Hover (#0F3B5C)
            accent: "#164E78", // Active Tab / Active State (#164E78)
            link: "#155E8A", // Important Links (#155E8A)
            light: "#155E8A", // Link text
            subtle: "#F0F5FA", // Soft blue background for active/brand wells
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
