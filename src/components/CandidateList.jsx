import CandidateCard from "./CandidateCard";

export default function CandidateList({
  candidates,
  selectedCandidate,
  setSelectedCandidate,
}) {
  return (
    <div className="space-y-3">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          selected={selectedCandidate?.id === candidate.id}
          onClick={() => setSelectedCandidate(candidate)}
        />
      ))}
    </div>
  );
}