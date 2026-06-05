import Navbar from "../components/Navbar";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${query}`);
  };

  return (
    <div className="min-h-screen bg-[#050816] overflow-hidden relative">

      {/* Glow Effects */}

      <div className="absolute left-[-200px] top-20 w-[500px] h-[500px] rounded-full bg-purple-700/20 blur-[180px]" />

      <div className="absolute right-[-200px] bottom-0 w-[500px] h-[500px] rounded-full bg-fuchsia-600/20 blur-[180px]" />

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        <div className="pt-24 flex flex-col items-center text-center">

          <div className="px-5 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-xl text-purple-300">
            Talent Intelligence Platform
          </div>

          <h1 className="mt-8 text-6xl md:text-8xl font-bold tracking-tight text-white">
            Find Talent
          </h1>

          <h2 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-300 via-fuchsia-400 to-purple-600 bg-clip-text text-transparent">
            Faster Than Ever
          </h2>

          <p className="mt-8 text-xl text-slate-300 max-w-2xl">
            Search candidates, resumes, skills, visa status and recruiter intelligence from a single workspace.
          </p>

          <p className="mt-3 text-slate-500">
            Created by Rahul Pahwa
          </p>

          {/* Search */}

          <div className="mt-14 w-full max-w-4xl">

            <div className="rounded-3xl border border-purple-500/20 bg-white/5 backdrop-blur-2xl p-3 flex items-center shadow-[0_0_60px_rgba(124,58,237,0.2)]">

              <Search
                size={24}
                className="ml-5 text-purple-300"
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills, title, visa, location..."
                className="flex-1 bg-transparent px-5 py-5 outline-none text-white placeholder:text-slate-500 text-lg"
              />

              <button
                onClick={handleSearch}
                className="px-8 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium hover:scale-105 transition"
              >
                Search
              </button>

            </div>

          </div>

          {/* Tags */}

          <div className="mt-10 flex flex-wrap justify-center gap-3">

            {[
              "Snowflake",
              "Java",
              "AWS",
              "Python",
              "Data Engineer",
              "React",
            ].map((item) => (
              <button
                key={item}
                onClick={() => navigate(`/search?q=${item}`)}
                className="px-5 py-3 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:border-purple-500/50"
              >
                {item}
              </button>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}