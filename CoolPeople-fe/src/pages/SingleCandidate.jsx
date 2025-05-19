import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function SingleCandidate() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);

  useEffect(() => {
    console.log(id)
    const fetchCandidate = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates/${id}`);
        setCandidate(res.data);
      } catch (err) {
        console.error("Error fetching candidate:", err);
      }
    };

    fetchCandidate();
  }, [id]);

  if (!candidate) return <div>Loading...</div>;
  console.log(candidate)

  return (
    <div className="single-candidate-page">
        <div className="CandidateProfile">
        <div className="image-wrapper3">
                <img
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
            <div className="user-profile-info">
                <h2>{candidate.name}</h2>
                <p><strong>Position:</strong> {candidate.position}</p>
                {/* <p><strong>Party:</strong> {candidate.party || "N/A"}</p>
                <p><strong>Website:</strong> {candidate.website || "N/A"}</p> */}
                <p><strong>Bio:</strong> {candidate.bio ?? "null"}</p>
            </div>
        </div>
      {/* You can also render full stance details here if needed */}
      <hr />
      {candidate.stances && typeof candidate.stances === 'object' && (
        <div className="stance-grid">
{Object.entries(candidate.stances)
  .filter(([key]) => key !== "averageScore")
  .map(([category, data]) => (
    <div key={category} className="stance-card">
      <h3>
        {category}
        <span className={`score-bubbleinline ${
          candidate.stances?.averageScore == null
            ? "bubble-black"
            : candidate.stances.averageScore > 5
            ? "bubble-blue"
            : "bubble-red"
        }`}>
          {data.score ?? "N/A"}
        </span>
      </h3>
      <p>{data.shortSummary}</p>
    </div>
))}
    </div>
)}
</div>
  );
}

export default SingleCandidate;
