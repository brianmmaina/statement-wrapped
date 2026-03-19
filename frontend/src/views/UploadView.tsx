import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BankSelector } from "../components/BankSelector";
import { UploadZone } from "../components/UploadZone";
import { fetchAnalysis, ingestStatement } from "../hooks/useAnalysis";

const PROGRESS_STEPS = ["Parsing CSV", "Categorizing transactions", "Building analysis"];
const STEP_DELAY_MS = 1500;

export function UploadView() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState("chase");
  const [uploading, setUploading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgressStep(0);

    const stepInterval = setInterval(() => {
      setProgressStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, STEP_DELAY_MS);

    try {
      const { statement_id } = await ingestStatement(file, bank);
      clearInterval(stepInterval);
      setProgressStep(PROGRESS_STEPS.length - 1);
      const analysis = await fetchAnalysis(statement_id);
      navigate(`/analysis/${statement_id}`, { state: { analysis } });
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "72px 24px 48px", maxWidth: 560, margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "DM Serif Display",
          fontSize: 32,
          margin: "0 0 8px",
          color: "var(--color-text-primary)",
        }}
      >
        Upload Statement
      </h1>
      <p
        style={{
          fontFamily: "DM Sans",
          fontSize: 16,
          color: "var(--color-text-secondary)",
          margin: "0 0 32px",
        }}
      >
        Drop your CSV file and select your bank to get started.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 24 }}>
          <UploadZone file={file} onFileChange={(f) => setFile(f)} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              fontFamily: "DM Sans",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              marginBottom: 12,
            }}
          >
            Bank
          </label>
          <BankSelector value={bank} onChange={setBank} />
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          style={{
            width: "100%",
            padding: "16px 24px",
            fontFamily: "DM Sans",
            fontSize: 16,
            fontWeight: 500,
            background: file && !uploading ? "var(--color-accent)" : "var(--color-border)",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: file && !uploading ? "pointer" : "not-allowed",
            transition: "background 150ms",
          }}
        >
          {uploading ? "Analyzing your transactions..." : "Analyze Statement"}
        </button>

        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: 24 }}
          >
            {PROGRESS_STEPS.map((step, i) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                  fontFamily: "DM Sans",
                  fontSize: 14,
                  color: i <= progressStep ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: i < progressStep ? "var(--color-success)" : i === progressStep ? "var(--color-accent)" : "var(--color-border)",
                    background: i < progressStep ? "var(--color-success)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i < progressStep && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {step}
              </div>
            ))}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "var(--color-warning-subtle)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "DM Sans",
              fontSize: 14,
              color: "var(--color-warning)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error}
          </motion.div>
        )}
      </form>
    </div>
  );
}
