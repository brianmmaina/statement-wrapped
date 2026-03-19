import { Link, useNavigate } from "react-router-dom";
import { AnalysisView } from "../components/AnalysisView";
import { SAMPLE_ANALYSIS } from "../constants/sampleData";

export function DemoView() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", overflow: "hidden" }}>
      <div
        style={{
          height: 48,
          background: "var(--color-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "DM Sans",
          fontSize: 14,
          color: "white",
        }}
      >
        Live Demo — This analysis uses fictional transaction data.{" "}
        <Link
          to="/upload"
          style={{
            color: "white",
            textDecoration: "underline",
            fontWeight: 500,
          }}
        >
          Upload your own statement →
        </Link>
      </div>

      <div
        style={{
          padding: "40px 24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "DM Serif Display",
            fontSize: 32,
            margin: 0,
            color: "var(--color-text-primary)",
          }}
        >
          Sample Analysis
        </h1>
        <Link
          to="/upload"
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
          Try with your data →
        </Link>
      </div>

      <div style={{ padding: "0 24px 56px", minWidth: 0 }}>

        <AnalysisView
          analysis={SAMPLE_ANALYSIS}
          isSample={false}
          isDemo={true}
          onUploadAnother={() => navigate("/upload")}
        />
      </div>
    </div>
  );
}
