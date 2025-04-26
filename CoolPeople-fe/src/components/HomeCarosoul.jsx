import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App"

function HomeCarousel() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
        const sortedCandidates = response.data.sort((a, b) => {
          return (b.totalRaised || 0) - (a.totalRaised || 0);
        });
        setCandidates(sortedCandidates);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchCandidates();
  }, []);

  return (
    <div className="HomeCarousel">
      {candidates.map((candidate) => {
        console.log("Rendering candidate:", candidate.photo_url);
  
        return (
          <div key={candidate.id} className="candidate-card">
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{candidate.name}</div>
            <img
              src={candidate.photo_url}
              alt={`${candidate.name}`}
            />
            <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{candidate.position}</div>
          </div>
        );
      })}
    </div>
  );  
}

export default HomeCarousel;
