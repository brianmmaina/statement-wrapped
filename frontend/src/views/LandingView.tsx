import { Link } from "react-router-dom";
import { HeroScreenshotCluster } from "../components/HeroScreenshotCluster";
import { ProcessCard } from "../components/ProcessCard";
import { HOW_IT_WORKS_STEPS } from "../constants/howItWorksSteps";

/* Google favicon service — reliable, no CORS issues */
const BANK_LOGOS: Record<string, string> = {
  Chase: "https://www.google.com/s2/favicons?domain=chase.com&sz=48",
  "Bank of America": "https://www.google.com/s2/favicons?domain=bankofamerica.com&sz=48",
  "Apple Card": "https://www.google.com/s2/favicons?domain=apple.com&sz=48",
  "Wells Fargo": "https://www.google.com/s2/favicons?domain=wellsfargo.com&sz=48",
};

export function LandingView() {
  return (
    <div
      className="landing-page"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        {/* Hero — 2-column: text left, screenshot cluster right */}
        <section
          className="hero-section"
          style={{
            padding: "140px 0 100px",
            display: "flex",
            alignItems: "center",
            gap: 48,
          }}
        >
          <div
            style={{
              flex: "1 1 50%",
              minWidth: 0,
            }}
          >
            <h1
              style={{
                fontFamily: "DM Serif Display",
                fontSize: 56,
                margin: 0,
                color: "var(--color-text-primary)",
              }}
            >
              StatementWrapped
            </h1>
            <p
              style={{
                fontFamily: "DM Sans",
                fontSize: 20,
                color: "var(--color-text-secondary)",
                margin: "20px 0 36px",
                maxWidth: 560,
                lineHeight: 1.6,
              }}
            >
              Upload a bank statement CSV and get a categorized spending analysis in seconds. No bank connection required.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                to="/upload"
                style={{
                  padding: "14px 24px",
                  fontFamily: "DM Sans",
                  fontSize: 16,
                  fontWeight: 500,
                  background: "var(--color-accent)",
                  color: "white",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                Upload Your Statement
              </Link>
              <Link
                to="/demo"
                style={{
                  padding: "14px 24px",
                  fontFamily: "DM Sans",
                  fontSize: 16,
                  fontWeight: 500,
                  background: "transparent",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "background 150ms, border-color 150ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-accent-subtle)";
                  e.currentTarget.style.borderColor = "var(--color-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                See Live Demo
              </Link>
            </div>
          </div>
          <div
            className="hero-cluster-wrapper"
            style={{
              flex: "1 1 50%",
              minWidth: 0,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100%", maxWidth: 480 }}>
              <HeroScreenshotCluster />
            </div>
          </div>
        </section>

        {/* How It Works — 3-card visual process */}
        <section
          className="how-it-works-section"
          style={{
            padding: "100px 24px",
            margin: "0 -24px",
            borderTop: "1px solid var(--color-border-subtle)",
            background: "rgba(240, 237, 232, 0.2)",
          }}
        >
          <h2
            style={{
              fontFamily: "DM Serif Display",
              fontSize: 32,
              margin: "0 0 56px",
              color: "var(--color-text-primary)",
              textAlign: "center",
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 32,
              maxWidth: 1100,
              margin: "0 auto",
            }}
            className="how-it-works-cards"
          >
            {HOW_IT_WORKS_STEPS.map(({ step, title, body, image }) => (
              <ProcessCard key={step} step={step} title={title} body={body} image={image} />
            ))}
          </div>
        </section>

        {/* Supported Banks */}
        <section
          style={{
            padding: "80px 0 100px",
          }}
        >
          <h2
            style={{
              fontFamily: "DM Sans",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              textAlign: "center",
              margin: "0 0 24px",
            }}
          >
            Works with your bank
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {(["Chase", "Bank of America", "Apple Card", "Wells Fargo"] as const).map((bank) => (
              <span
                key={bank}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontFamily: "DM Sans",
                  fontSize: 13,
                  fontWeight: 500,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              >
                <img
                  src={BANK_LOGOS[bank]}
                  alt=""
                  width={24}
                  height={24}
                  style={{ objectFit: "contain" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                {bank}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
