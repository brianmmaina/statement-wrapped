/**
 * Hero screenshot cluster layout. Tweak position (%), size (px), and rotation (deg) here.
 * - primary: largest anchor image
 * - secondary: smaller, supports primary
 * - tertiary: medium-small
 */
export const HERO_SCREENSHOT_CONFIG = {
  primary: {
    src: "/hero-screenshot-3.png",
    width: 280,
    top: "8%",
    left: "38%",
    rotation: -2,
    zIndex: 3,
  },
  secondary: {
    src: "/hero-screenshot-1.png",
    width: 170,
    top: "44%",
    left: "4%",
    rotation: 3,
    zIndex: 1,
  },
  tertiary: {
    src: "/hero-screenshot-2.png",
    width: 190,
    top: "0%",
    left: "22%",
    rotation: 1,
    zIndex: 4,
  },
} as const;
