interface ProcessCardProps {
  step: number;
  title: string;
  body: string;
  image: string;
}

export function ProcessCard({ step, title, body, image }: ProcessCardProps) {
  return (
    <div
      className="process-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 0,
        background: "transparent",
        borderRadius: 8,
        border: "1px solid transparent",
        transition: "border-color 150ms, transform 150ms",
      }}
      onMouseEnter={(e) => {
        if (window.matchMedia("(min-width: 769px)").matches) {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          overflow: "hidden",
          borderRadius: 8,
          border: "0.5px solid rgba(0,0,0,0.05)",
          background: "var(--color-background)",
          aspectRatio: "16 / 10",
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            display: "block",
          }}
        />
      </div>
      <div style={{ padding: "0 4px" }}>
        <div
          style={{
            fontFamily: "DM Serif Display",
            fontSize: 40,
            color: "var(--color-accent)",
            opacity: 0.5,
            marginBottom: 4,
          }}
        >
          {step}
        </div>
        <h3
          style={{
            fontFamily: "DM Serif Display",
            fontSize: 18,
            margin: "0 0 8px",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "DM Sans",
            fontSize: 14,
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.5,
            maxWidth: 320,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
