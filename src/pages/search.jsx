import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProfilePanel from "../components/ProfilePanel";
import CandidateList from "../components/CandidateList";
import FiltersPanel from "../components/FiltersPanel";

export default function Search() {
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(
    searchParams.get("q") || ""
  );

  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filters, setFilters] = useState({
  visa: "",
  location: "",
  hasLinkedIn: false,
  hasEmail: false,
  hasResume: false,
});

  async function searchCandidates() {
    if (!query.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
    .rpc("search_candidates", {
        search_term: query
    });

    console.log(error);

    if (!error) {

  let filtered = data || [];

  if (filters.visa) {
    filtered = filtered.filter(
      (c) =>
        c["VISA"] &&
        c["VISA"].toLowerCase().includes(
          filters.visa.toLowerCase()
        )
    );
  }

  if (filters.location) {
    filtered = filtered.filter(
      (c) =>
        c["Current Location"] &&
        c["Current Location"]
          .toLowerCase()
          .includes(filters.location.toLowerCase())
    );
  }

  if (filters.hasLinkedIn) {
    filtered = filtered.filter(
      (c) =>
        c["LinkedIn"] &&
        c["LinkedIn"].trim() !== ""
    );
  }
  if (filters.hasResume) {
  filtered = filtered.filter(
    (c) =>
      c.resume_url &&
      c.resume_url.trim() !== ""
  );
}

  if (filters.hasEmail) {
    filtered = filtered.filter(
      (c) =>
        c["Email"] &&
        c["Email"].trim() !== ""
    );
  }

  setCandidates(filtered);

  if (filtered.length > 0) {
    setSelectedCandidate(filtered[0]);
  } else {
    setSelectedCandidate(null);
  }
}

    setLoading(false);
  }

  useEffect(() => {
  if (query) {
    searchCandidates();
  }
}, [query, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">

      <div className="border-b border-white/10 p-5">

        <h1 className="text-2xl font-bold">
          Talent Hub
        </h1>

        <div className="flex gap-3 mt-4">

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills..."
            className="flex-1 bg-white/10 rounded-xl p-4 outline-none"
          />

          <button
            onClick={searchCandidates}
            className="px-6 rounded-xl bg-purple-600"
          >
            Search
          </button>
          <div className="mt-3 text-sm text-cyan-300">
  {candidates.length.toLocaleString()} candidates found
</div>

        </div>

      </div>

      <div className="grid grid-cols-12 h-[calc(100vh-100px)]">
        {/* FILTERS */}

<div className="col-span-2">
  <FiltersPanel
  filters={filters}
  setFilters={setFilters}
/>
</div>

        {/* LEFT */}

<div className="col-span-4 border-r border-cyan-500/10 overflow-y-auto bg-slate-900/20">
          {loading && (
            <div className="p-4">
              Searching...
            </div>
          )}

          <div className="p-4">

  <button
    onClick={() => {
      const emails = candidates
        .map((c) => c["Email"])
        .filter(Boolean)
        .join(";");

      navigator.clipboard.writeText(emails);

      alert("Emails copied");
    }}
    className="mb-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300"
  >
    Copy All Emails
  </button>

  {!loading && (
    <CandidateList
      candidates={candidates}
      selectedCandidate={selectedCandidate}
      setSelectedCandidate={setSelectedCandidate}
    />
  )}

</div>
        </div>

        {/* RIGHT */}

        
    <div className="col-span-6 overflow-y-auto bg-gradient-to-b from-slate-900/40 to-slate-950/70">
    <ProfilePanel candidate={selectedCandidate} />
    </div>

      </div>

    </div>
  );
}