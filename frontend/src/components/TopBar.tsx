import { Link, NavLink } from "react-router-dom";

export function TopBar() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        zIndex: 100,
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          color: "var(--color-text-primary)",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            background: "var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "DM Serif Display",
            fontSize: 14,
            fontWeight: 400,
            color: "white",
          }}
        >
          SW
        </span>
        <span style={{ fontFamily: "DM Serif Display", fontSize: 18 }}>
          StatementWrapped
        </span>
      </Link>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <NavLink
          to="/demo"
          end
          style={({ isActive }) => ({
            color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
            paddingBottom: 4,
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            textDecoration: "none",
            transition: "color 120ms",
          })}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.getAttribute("aria-current")) {
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }
          }}
        >
          Demo
        </NavLink>
        <NavLink
          to="/upload"
          end
          style={({ isActive }) => ({
            color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
            paddingBottom: 4,
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            textDecoration: "none",
            transition: "color 120ms",
          })}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            if (!target.getAttribute("aria-current")) {
              target.style.color = "var(--color-text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
            if (!target.getAttribute("aria-current")) {
              target.style.color = "var(--color-text-secondary)";
            }
          }}
        >
          Upload
        </NavLink>
      </nav>

      <Link
        to="/upload"
        style={{
          padding: "10px 20px",
          fontFamily: "DM Sans",
          fontSize: 14,
          fontWeight: 500,
          background: "var(--color-accent)",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          textDecoration: "none",
          transition: "background 150ms, transform 100ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-accent-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--color-accent)";
        }}
      >
        Upload Statement
      </Link>
    </header>
  );
}
