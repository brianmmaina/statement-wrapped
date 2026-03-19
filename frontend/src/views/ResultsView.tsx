import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AnalysisView } from "../components/AnalysisView";
import { fetchAnalysis } from "../hooks/useAnalysis";
import type { AnalysisData } from "../constants/sampleData";

export function ResultsView() {
  const { statementId } = useParams<{ statementId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedAnalysis = (location.state as { analysis?: AnalysisData })?.analysis;
  const [analysis, setAnalysis] = useState<AnalysisData | null>(passedAnalysis ?? null);
  const [loading, setLoading] = useState(!passedAnalysis);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!statementId) return;
    // Refetch if no analysis or if analysis is missing summary (backend may generate on demand)
    const shouldFetch = !passedAnalysis || (passedAnalysis && !passedAnalysis.summary?.trim());
    if (!shouldFetch) return;

    if (!passedAnalysis) setLoading(true);
    fetchAnalysis(statementId)
      .then(setAnalysis)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [statementId, passedAnalysis]);

  if (loading) {
    return (
      <div
        style={{
          padding: "72px 24px 48px",
          maxWidth: 1280,
          margin: "0 auto",
          fontFamily: "DM Sans",
          fontSize: 16,
          color: "var(--color-text-secondary)",
        }}
      >
        Loading analysis...
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div
        style={{
          padding: "72px 24px 48px",
          maxWidth: 1280,
          margin: "0 auto",
          fontFamily: "DM Sans",
          fontSize: 16,
          color: "var(--color-warning)",
        }}
      >
        {error ?? "Failed to load analysis."}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ padding: "72px 24px 48px", maxWidth: 1280, margin: "0 auto" }}
    >
      <AnalysisView
        analysis={analysis}
        onUploadAnother={() => navigate("/upload")}
      />
    </motion.div>
  );
}
