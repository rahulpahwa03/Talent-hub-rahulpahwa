import { SlidersHorizontal, RotateCcw } from "lucide-react";

const VISA_OPTIONS = [
  { value: "",          label: "All Visa Types" },
  { value: "US Citizen", label: "🇺🇸 US Citizen" },
  { value: "Green Card", label: "💚 Green Card" },
  { value: "H1B",        label: "🔵 H1B" },
  { value: "H4 EAD",    label: "H4 EAD" },
  { value: "OPT",        label: "OPT" },
  { value: "OPT EAD",   label: "OPT EAD" },
  { value: "L2S",        label: "L2S" },
];

export default function FiltersPanel({ filters, setFilters }) {
  const hasActive = filters.visa || filters.location ||
    filters.hasLinkedIn || filters.hasEmail || filters.hasResume;

  const reset = () => setFilters({
    visa: "", location: "",
    hasLinkedIn: false, hasEmail: false, hasResume: false,
  });

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "16px 14px",
      gap: 20,
      overflowY: "auto",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 12, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.1em",
          color: "var(--text-secondary)",
        }}>
          <SlidersHorizontal size={13} style={{ color: "#8b5cf6" }} />
          Filters
        </div>
        {hasActive && (
          <button
            onClick={reset}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "var(--text-muted)",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            <RotateCcw size={11} />
            Reset
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="divider" style={{ margin: "0 -14px" }} />

      {/* Visa */}
      <div>
        <label className="filter-label">Visa Status</label>
        <select
          value={filters.visa}
          onChange={e => setFilters({ ...filters, visa: e.target.value })}
          className="input-base"
          style={{ fontSize: 12.5 }}
        >
          {VISA_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="filter-label">Location</label>
        <input
          value={filters.location}
          onChange={e => setFilters({ ...filters, location: e.target.value })}
          placeholder="e.g. TX, CA, New York…"
          className="input-base"
          style={{ fontSize: 12.5 }}
        />
      </div>

      {/* Divider */}
      <div className="divider" style={{ margin: "0 -14px" }} />

      {/* Checkboxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <label className="filter-label" style={{ marginBottom: 6 }}>Has Data</label>

        {[
          { key: "hasEmail",    label: "Has Email",    icon: "✉️" },
          { key: "hasLinkedIn", label: "Has LinkedIn", icon: "🔗" },
          { key: "hasResume",   label: "Has Resume",   icon: "📄" },
        ].map(item => (
          <label key={item.key} className="checkbox-row" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filters[item.key]}
              onChange={e => setFilters({ ...filters, [item.key]: e.target.checked })}
            />
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
              <span>{item.icon}</span>
              {item.label}
            </span>
          </label>
        ))}
      </div>

    </div>
  );
}