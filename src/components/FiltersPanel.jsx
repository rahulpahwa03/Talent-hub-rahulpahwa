export default function FiltersPanel({
  filters,
  setFilters,
}) {
  return (
    <div className="h-full bg-slate-950 border-r border-cyan-500/10 p-5">

      <h2 className="text-xl font-bold text-cyan-300 mb-6">
        Filters
      </h2>
      <label className="flex items-center gap-3 cursor-pointer">

  <input
    type="checkbox"
    checked={filters.hasResume}
    onChange={(e) =>
      setFilters({
        ...filters,
        hasResume: e.target.checked,
      })
    }
  />

  <span className="text-sm">
    Has Resume
  </span>

</label>

      <div className="space-y-5">

        {/* VISA */}

        <div>
          <label className="text-sm text-slate-400">
            Visa
          </label>

          <select
            value={filters.visa}
            onChange={(e) =>
              setFilters({
                ...filters,
                visa: e.target.value,
              })
            }
            className="mt-2 w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
          >
            <option value="">All</option>
            <option value="US Citizen">US Citizen</option>
            <option value="Green Card">Green Card</option>
            <option value="H1B">H1B</option>
            <option value="H4 EAD">H4 EAD</option>
            <option value="OPT">OPT</option>
            <option value="OPT EAD">OPT EAD</option>
            <option value="L2S">L2S</option>
          </select>
        </div>

        {/* LOCATION */}

        <div>
          <label className="text-sm text-slate-400">
            Location
          </label>

          <input
            value={filters.location}
            onChange={(e) =>
              setFilters({
                ...filters,
                location: e.target.value,
              })
            }
            placeholder="TX, CA, NJ..."
            className="mt-2 w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white"
          />
        </div>

        {/* LINKEDIN */}

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasLinkedIn}
            onChange={(e) =>
              setFilters({
                ...filters,
                hasLinkedIn: e.target.checked,
              })
            }
          />

          <span className="text-sm">
            Has LinkedIn
          </span>
        </label>

        {/* EMAIL */}

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasEmail}
            onChange={(e) =>
              setFilters({
                ...filters,
                hasEmail: e.target.checked,
              })
            }
          />

          <span className="text-sm">
            Has Email
          </span>
        </label>

      </div>

    </div>
  );
}