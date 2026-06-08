import CandidateCard from "./CandidateCard";
import { motion } from "framer-motion";

export default function CandidateList({ candidates, selectedCandidate, setSelectedCandidate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {candidates.map((candidate, idx) => (
        <motion.div
          key={candidate.id ?? idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.25, ease: [0, 0, 0.2, 1] }}
        >
          <CandidateCard
            candidate={candidate}
            selected={selectedCandidate?.id === candidate.id}
            onClick={() => setSelectedCandidate(candidate)}
          />
        </motion.div>
      ))}
    </div>
  );
}
