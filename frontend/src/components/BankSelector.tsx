import { useState } from "react";
import { Building2, CreditCard, Landmark } from "lucide-react";

/* Google favicon service — reliable, no CORS issues. Lucide icons as fallback. */
const BANKS = [
  { value: "chase", label: "Chase", logoUrl: "https://www.google.com/s2/favicons?domain=chase.com&sz=48", FallbackIcon: Building2 },
  { value: "boa", label: "Bank of America", logoUrl: "https://www.google.com/s2/favicons?domain=bankofamerica.com&sz=48", FallbackIcon: Landmark },
  { value: "apple_card", label: "Apple Card", logoUrl: "https://www.google.com/s2/favicons?domain=apple.com&sz=48", FallbackIcon: CreditCard },
  { value: "wells_fargo", label: "Wells Fargo", logoUrl: "https://www.google.com/s2/favicons?domain=wellsfargo.com&sz=48", FallbackIcon: Building2 },
];

interface BankSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

function BankOption({
  bank,
  selected,
  onChange,
  FallbackIcon,
}: {
  bank: (typeof BANKS)[0];
  selected: boolean;
  onChange: (v: string) => void;
  FallbackIcon: typeof Building2;
}) {
  const [logoError, setLogoError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onChange(bank.value)}
      style={{
        flex: "1 1 140px",
        minWidth: 140,
        padding: "16px 20px",
        fontFamily: "DM Sans",
        fontSize: 14,
        fontWeight: 500,
        border: `2px solid ${selected ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: 8,
        background: selected ? "var(--color-accent-subtle)" : "var(--color-surface)",
        color: "var(--color-text-primary)",
        cursor: "pointer",
        transition: "border-color 120ms, background-color 120ms",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {logoError ? (
        <FallbackIcon
          size={22}
          strokeWidth={2}
          style={{ color: selected ? "var(--color-accent)" : "var(--color-text-secondary)" }}
        />
      ) : (
        <img
          src={bank.logoUrl}
          alt=""
          width={24}
          height={24}
          style={{ objectFit: "contain" }}
          onError={() => setLogoError(true)}
        />
      )}
      {bank.label}
    </button>
  );
}

export function BankSelector({ value, onChange }: BankSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {BANKS.map((b) => {
        const selected = value === b.value;
        const FallbackIcon = b.FallbackIcon;
        return (
          <BankOption
            key={b.value}
            bank={b}
            selected={selected}
            onChange={onChange}
            FallbackIcon={FallbackIcon}
          />
        );
      })}
    </div>
  );
}
