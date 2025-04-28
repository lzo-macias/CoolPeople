import React from "react";

function CandidateCarousel({ title, candidates }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="candidate-section" style={{ marginBottom: '2rem' }}>
      <h3>{title}</h3>

      {/* 👇 SAME CLASSNAME as HomeCarousel */}
      <div className="HomeCarousel">
        {candidates.map((candidate) => (
          <div key={candidate.name} className="candidate-card">
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{candidate.name}</div>

            {candidate.photo_url && (
              <img
                src={candidate.photo_url}
                alt={`${candidate.name}`}
                // ❌ remove custom inline size, let CSS handle it!
              />
            )}

            {candidate.position && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{candidate.position}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CandidateCarousel;
