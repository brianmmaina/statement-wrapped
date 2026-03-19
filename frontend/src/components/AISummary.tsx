import { motion } from "framer-motion";

interface AISummaryProps {
  summary: string;
}

export function AISummary({ summary }: AISummaryProps) {
  const paragraphs = summary.split(/\n\n+/).filter((p) => p.trim().length > 0);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      style={{
        padding: "40px 0",
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        className="ai-summary-layout"
        style={{
          display: "flex",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 200,
            minWidth: 200,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: "DM Sans",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            AI Analysis
          </div>
          <span
            style={{
              display: "inline-block",
              fontFamily: "DM Sans",
              fontSize: 11,
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              padding: "2px 6px",
              marginBottom: 12,
            }}
          >
            Powered by OpenAI
          </span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: "var(--color-success)",
              animation: "ai-summary-pulse 2s ease-in-out infinite",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: "DM Sans",
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--color-text-primary)",
                margin: i === 0 ? 0 : "16px 0 0",
              }}
            >
              {para.trim()}
            </p>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
