import { HERO_SCREENSHOT_CONFIG } from "../constants/heroScreenshotConfig";

const SCREENSHOTS = [
  { key: "primary", ...HERO_SCREENSHOT_CONFIG.primary },
  { key: "secondary", ...HERO_SCREENSHOT_CONFIG.secondary },
  { key: "tertiary", ...HERO_SCREENSHOT_CONFIG.tertiary },
] as const;

export function HeroScreenshotCluster() {
  return (
    <div
      className="hero-screenshot-cluster"
      style={{
        position: "relative",
        width: "100%",
        minHeight: 420,
      }}
    >
      {SCREENSHOTS.map(({ key, src, width, top, left, rotation, zIndex }) => (
        <div
          key={key}
          style={{
            position: "absolute",
            top,
            left,
            width,
            zIndex,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <img
            src={src}
            alt=""
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: 10,
              border: "0.5px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
        </div>
      ))}
    </div>
  );
}
