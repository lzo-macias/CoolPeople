import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function CandidateGrid({ title }) {
  const [allCandidates, setAllCandidates] = useState([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
        console.log("this is all candidates:", res.data);
        setAllCandidates(res.data);
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      }
    };

    fetchCandidates();
  }, []);

  if (!allCandidates || allCandidates.length === 0) return null;

  return (
    <div className="candidate-section" style={{ marginBottom: "2rem" }}>
      <h3>Track All Your Politicians</h3>
      <div className="candidate-grid">
        {allCandidates.map((candidate) => (
          <Link to={`/candidates/${candidate.id}`} key={candidate.id} className="candidate-card-link">
            <div className="candidate-card">
              <div className="image-wrapper">
                <img
                  loading="lazy"
                  src={candidate.photo_url}
                  alt={candidate.name}
                  className={`candidate-image ${
                    candidate.stances?.averageScore == null
                      ? "border-black"
                      : candidate.stances.averageScore > 5
                      ? "border-blue"
                      : "border-red"
                  }`}
                />
                <div
                  className={`score-line ${
                    candidate.stances?.averageScore == null
                      ? "line-black"
                      : candidate.stances.averageScore > 5
                      ? "line-blue"
                      : "line-red"
                  }`}
                >
                  <div
                    className={`score-bubble ${
                      candidate.stances?.averageScore == null
                        ? "bubble-black"
                        : candidate.stances.averageScore > 5
                        ? "bubble-blue"
                        : "bubble-red"
                    }`}
                  >
                    {candidate.stances?.averageScore ?? "null"}
                  </div>
                </div>
              </div>
              <div className="candidate-name">{candidate.name}</div>
              <div className="candidate-position">{candidate.position}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CandidateGrid;
