// import React from "react";
// import { Link } from "react-router-dom";


// function CandidateCarousel({ title, candidates }) {
//   if (!candidates || candidates.length === 0) return null;

//   const sortedCandidates = [...candidates].sort((a, b) => {
//     const aFin = parseFloat(a.finances || 0);
//     const bFin = parseFloat(b.finances || 0);
//     return bFin - aFin; // descending
//   });

//   return (
//     <div className="candidate-section" style={{ marginBottom: '2rem' }}>
//       <h3>{title}</h3>

//       <div className="HomeCarousel">
//         {sortedCandidates.map((candidate) => {
//           const score = candidate.stances?.averageScore ?? null;
//           const borderClass =
//             score == null
//               ? "border-black"
//               : score > 5
//               ? "border-blue"
//               : "border-red";

//           const bubbleClass =
//             score == null
//               ? "bubble-black"
//               : score > 5
//               ? "bubble-blue"
//               : "bubble-red";

//           const lineClass =
//             score == null
//               ? "line-black"
//               : score > 5
//               ? "line-blue"
//               : "line-red";

//           return (
//             <Link to={`/candidates/${candidate.id}`} key={candidate.id} className="candidate-card-link">
//             <div key={candidate.id} className="candidate-card">
//               <div className="image-wrapper2">
//                 <img
//                   src={candidate.photo_url}
//                   alt={candidate.name}
//                   className={`${borderClass}`}
//                 />
//                 <div className={`score-line ${lineClass}`}>
//                   <div className={`score-bubble ${bubbleClass}`}>
//                     {score !== null ? Math.round(score) : "null"}
//                   </div>
//                 </div>
//               </div>
//               <div className="candidate-name">{candidate.name}</div>
//               {candidate.position && (
//                 <div className="candidate-position">{candidate.position}</div>
//               )}
//             </div>
//             </Link>
//           );
//         })}
//       </div>

//     </div>
//   );
// }

// export default CandidateCarousel;

import React, { useState } from "react";
import { Link } from "react-router-dom";

function CandidateCarousel({ title, candidates }) {
  const [showAll, setShowAll] = useState(false);

  if (!candidates || candidates.length === 0) return null;

  // 🔽 Sort by finances
  const sortedCandidates = [...candidates].sort((a, b) => {
    const aFin = parseFloat(a.finances || 0);
    const bFin = parseFloat(b.finances || 0);
    return bFin - aFin;
  });

  // 🔽 Show top 8 or all
  const visibleCandidates = showAll ? sortedCandidates : sortedCandidates.slice(0, 8);

  return (
    <div className="candidate-section" style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>{title}</h3>
        {!showAll && sortedCandidates.length > 8 && (
          <button
            className="view-all-button"
            onClick={() => setShowAll(true)}
            style={{
              background: "none",
              border: "none",
              color: "#007BFF",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            View All &gt;
          </button>
        )}
      </div>

      <div className="HomeCarousel">
        {visibleCandidates.map((candidate, index) => {
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
                    {/* 🏆 Trophy for top 3 */}
                    <div>
                    {/* {index < 3 && (
                        <img className='trophies' src="/icons/trophy.png"></img>
                      )} */}
                    </div>

                    <div className="image-wrapper2" style={{ position: "relative" }}>
                      <img
                        src={candidate.photo_url}
                        alt={candidate.name}
                        className={`${borderClass}`}
                      />
                      <div className={`score-line ${lineClass}`}>
                        <div className={`score-bubble ${bubbleClass}`}>
                          {score !== null ? score : "null"}
                        </div>
                      </div>
                      
                    </div>
                    <div className="candidate-name">{candidate.name}</div>
                    {/* {candidate.position && (
                      <div className="candidate-position">{candidate.position}</div>
                    )} */}
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}

export default CandidateCarousel;
