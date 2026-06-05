import { useState } from "react";
<button
  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300"
>
  Edit Profile
</button>
export default function ProfilePanel({ candidate }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!candidate) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Select a candidate
      </div>
    );
  }

  const skills =
    candidate["Skills"]
      ?.split(/[|,]/)
      .slice(0, 30)
      .filter(Boolean) || [];

  const tabs = [
    "overview",
    "skills",
    "resume",
    "notes",
  ];

  return (
    
    <div className="h-full overflow-y-auto p-6">

      <div className="flex items-center gap-4">

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center text-xl font-bold">
          {(candidate["Candidate Name"] || "NA")
            .split(" ")
            .slice(0, 2)
            .map((x) => x[0])
            .join("")}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            {candidate["Candidate Name"]}
          </h2>

          <p className="text-slate-400">
            {candidate["Title"]}
          </p>
        </div>

      </div>

      <div className="flex gap-6 mt-8 border-b border-white/10 pb-3">

        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize ${
              activeTab === tab
                ? "text-purple-400"
                : "text-slate-400"
            }`}
          >
            {tab}
          </button>
        ))}

      </div>

      {activeTab === "overview" && (
        <div className="mt-6 space-y-4">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-slate-500 text-sm">
              Email
            </div>

            <div className="flex items-center gap-2">

            <span>
                {candidate["Email"] || "-"}
            </span>

            <button
                onClick={() =>
                navigator.clipboard.writeText(
                    candidate["Email"] || ""
                )
                }
                className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs"
            >
                Copy
            </button>

            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-slate-500 text-sm">
              Phone
            </div>

            <div className="flex items-center gap-2">

  <span>
    {candidate["Contact No"] || "-"}
  </span>

  <button
    onClick={() =>
      navigator.clipboard.writeText(
        candidate["Contact No"] || ""
      )
    }
    className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs"
  >
    Copy
  </button>

</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-slate-500 text-sm">
              Location
            </div>

            <div className="text-white">
              {candidate["Current Location"] || "-"}
            </div>
          </div>
          <div>
  <span className="text-slate-500">
    LinkedIn
  </span>

  {candidate["LinkedIn"] ? (
    <div className="mt-2 flex gap-2">

      <a
        href={
          candidate["LinkedIn"].startsWith("http")
            ? candidate["LinkedIn"]
            : `https://${candidate["LinkedIn"]}`
        }
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
      >
        Open LinkedIn
      </a>

      <button
        onClick={() =>
          navigator.clipboard.writeText(
            candidate["LinkedIn"]
          )
        }
        className="px-4 py-2 rounded-xl bg-white/10"
      >
        Copy
      </button>

    </div>
  ) : (
    <div className="mt-2 text-red-400">
      No LinkedIn Available
    </div>
  )}
 <div>

  <span className="text-slate-500">
    Resume
  </span>

  {candidate?.resume_url ? (
    <a
      href={candidate.resume_url}
      target="_blank"
      rel="noreferrer"
      className="block mt-2 text-cyan-300"
    >
      Open Resume
    </a>
  ) : (
    <div className="mt-2 text-red-400">
      No Resume Available
    </div>
  )}

</div>
</div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-slate-500 text-sm">
              Visa
            </div>

            <div className="text-white">
              {candidate["VISA"] || "-"}
            </div>
          </div>

        </div>
      )}

      {activeTab === "skills" && (
        <div className="flex flex-wrap gap-2 mt-6">

          {skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300"
            >
              {skill.trim()}
            </span>
          ))}

        </div>
      )}

      {activeTab === "resume" && (
        <div className="mt-6">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <button className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 rounded-xl">
              Upload Resume
            </button>
          </div>

        </div>
      )}

      {activeTab === "notes" && (
        <div className="mt-6">

          <textarea
            rows={8}
            placeholder="Candidate notes..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white"
          />

          <button className="mt-4 bg-purple-600 px-5 py-3 rounded-xl">
            Save Notes
          </button>

        </div>
      )}

    </div>
  );
}