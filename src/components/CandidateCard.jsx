export default function CandidateCard({
  candidate,
  selected,
  onClick,
}) {
  const initials = (candidate["Candidate Name"] || "NA")
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");

  const skills =
    candidate["Skills"]
      ?.split(/[|,]/)
      .slice(0, 5)
      .filter(Boolean) || [];

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer
        rounded-2xl
        border
        p-5
        transition-all
        hover:scale-[1.01]
        ${
          selected
            ? "border-purple-500 bg-purple-500/10"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }
      `}
    >
      <div className="flex justify-between">

        <div className="flex gap-4">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center font-bold text-lg">
            {initials}
          </div>

          <div>

            <h3 className="text-lg font-semibold text-white">
              {candidate["Candidate Name"]}
            </h3>

            <p className="text-slate-400 text-sm">
              {candidate["Title"] || "Candidate"}
            </p>

            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">

              <span>
                📍 {candidate["Current Location"] || "-"}
              </span>

              <span>
                🛂 {candidate["VISA"] || "-"}
              </span>

              <span>
                📧 {candidate["Email"] ? "Available" : "Missing"}
              </span>

            </div>
            <div className="flex flex-wrap gap-2 mt-3">

  {candidate["LinkedIn"] ? (
    <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs">
      LinkedIn
    </span>
  ) : (
    <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs">
      No LinkedIn
    </span>
  )}
  

</div>
{candidate.resume_url && (
  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
    Resume
  </span>
)}

          </div>

        </div>

        <div>

          <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
            Profile
          </div>

        </div>

      </div>

      <div className="flex flex-wrap gap-2 mt-4">

        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300"
          >
            {skill.trim()}
          </span>
        ))}

      </div>

    </div>
  );
}