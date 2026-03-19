import { useState, useCallback } from "react";

interface UploadZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function UploadZone({ file, onFileChange }: UploadZoneProps) {
  const [hover, setHover] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setHover(false);
      const f = e.dataTransfer.files[0];
      if (f?.name.toLowerCase().endsWith(".csv")) {
        onFileChange(f);
      }
    },
    [onFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setHover(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) onFileChange(f);
    };
    input.click();
  }, [onFileChange]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      style={{
        border: `2px dashed ${hover ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: 8,
        padding: "48px 32px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: hover ? "var(--color-accent-subtle)" : "var(--color-surface)",
        transition: "border-color 150ms, background-color 150ms",
      }}
    >
      {file ? (
        <>
          <div
            style={{
              width: 40,
              height: 40,
              margin: "0 auto 12px",
              borderRadius: "50%",
              background: "var(--color-success-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 16, color: "var(--color-text-primary)", marginBottom: 4 }}>
            {file.name}
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 14, color: "var(--color-text-tertiary)" }}>
            {formatSize(file.size)}
          </div>
        </>
      ) : (
        <>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-tertiary)"
            strokeWidth="1.5"
            style={{ margin: "0 auto 16px", display: "block" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div
            style={{
              fontFamily: "DM Serif Display",
              fontSize: 22,
              color: "var(--color-text-primary)",
              marginBottom: 8,
            }}
          >
            Drop your CSV here
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 14, color: "var(--color-text-tertiary)" }}>
            or click to browse
          </div>
        </>
      )}
    </div>
  );
}
