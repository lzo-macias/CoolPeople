import React from "react";
import { Link } from "react-router-dom";


function CandidateCarousel({ title, candidates }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="candidate-section" style={{ marginBottom: '2rem' }}>
      <h3>{title}</h3>

      <div className="HomeCarousel">
        {candidates.map((candidate) => {
          const score = candidate.stances?.averageScore ?? null;
          const borderClass =
            score == null
              ? "border-black"
              : score > 5
              ? "border-blue"
              : "border-red";

          const bubbleClass =
            score == null
              ? "bubble-black"
              : score > 5
              ? "bubble-blue"
              : "bubble-red";

          const lineClass =
            score == null
              ? "line-black"
              : score > 5
              ? "line-blue"
              : "line-red";

          return (
            <Link to={`/candidates/${candidate.id}`} key={candidate.id} className="candidate-card-link">
            <div key={candidate.id} className="candidate-card">
              <div className="image-wrapper2">
                <img
                  src={candidate.photo_url}
                  alt={candidate.name}
                  className={`${borderClass}`}
                />
                <div className={`score-line ${lineClass}`}>
                  <div className={`score-bubble ${bubbleClass}`}>
                    {score !== null ? Math.round(score) : "null"}
                  </div>
                </div>
              </div>
              <div className="candidate-name">{candidate.name}</div>
              {candidate.position && (
                <div className="candidate-position">{candidate.position}</div>
              )}
            </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}

export default CandidateCarousel;
