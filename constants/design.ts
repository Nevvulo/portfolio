/**
 * Design system constants for consistent spacing, breakpoints, and other design tokens
 */

// Breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: "468px",
  tablet: "600px",
  desktop: "768px",
  wide: "1200px",
  ultraWide: "1440px",
} as const;

// Spacing scale for consistent spacing throughout the app
export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  "3xl": "3rem", // 48px
  "4xl": "4rem", // 64px
} as const;

// Border radius values for consistent rounded corners
export const RADIUS = {
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  full: "9999px",
} as const;

// Typography scale for consistent font sizes
export const FONT_SIZE = {
  xs: "clamp(0.75rem, 0.875rem, 1rem)",
  sm: "clamp(0.85rem, 1rem, 1.2rem)",
  md: "clamp(0.9rem, 1.1rem, 1.3rem)",
  lg: "clamp(1rem, 1.4rem, 2rem)",
  xl: "clamp(1.25rem, 1.75rem, 2.5rem)",
  "2xl": "clamp(1.5rem, 2rem, 3rem)",
  "3xl": "clamp(2rem, 3rem, 4rem)",
} as const;

// Animation durations for consistent animations
export const ANIMATION = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slowest: "500ms",
} as const;

// Z-index scale for proper layering
export const Z_INDEX = {
  background: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
} as const;

// Helper function to generate media queries
export const media = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile})`,
  tablet: `@media (max-width: ${BREAKPOINTS.tablet})`,
  desktop: `@media (max-width: ${BREAKPOINTS.desktop})`,
  wide: `@media (min-width: ${BREAKPOINTS.wide})`,
  ultraWide: `@media (min-width: ${BREAKPOINTS.ultraWide})`,
} as const;
