/**
 * SkeletonCard — Matches the shape of a CandidateCard exactly.
 * Used during loading to avoid layout shift and spinner fatigue.
 */
export default function SkeletonCard() {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E8E6F0',
      borderRadius: 16,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* Top: Avatar + Name + Title */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="skel" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skel" style={{ height: 14, width: '58%', borderRadius: 6 }} />
          <div className="skel" style={{ height: 11, width: '40%', borderRadius: 6 }} />
        </div>
        {/* Exp badge */}
        <div className="skel" style={{ height: 22, width: 60, borderRadius: 99 }} />
      </div>

      {/* Middle: Skill pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[72, 58, 80, 48, 66].map((w, i) => (
          <div key={i} className="skel" style={{ height: 24, width: w, borderRadius: 99 }} />
        ))}
      </div>

      {/* Badges row: Visa + WorkPref + Availability */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skel" style={{ height: 22, width: 48, borderRadius: 99 }} />
        <div className="skel" style={{ height: 22, width: 64, borderRadius: 99 }} />
        <div className="skel" style={{ height: 22, width: 80, borderRadius: 99 }} />
      </div>

      {/* Bottom: action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <div className="skel" style={{ height: 34, flex: 1, borderRadius: 10 }} />
        <div className="skel" style={{ height: 34, flex: 1, borderRadius: 10 }} />
        <div className="skel" style={{ height: 34, width: 34, borderRadius: 10, flexShrink: 0 }} />
      </div>

      {/* Last updated */}
      <div className="skel" style={{ height: 10, width: 100, borderRadius: 6, marginTop: -4 }} />
    </div>
  );
}
