// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";

// function CandidateGrid({ title }) {
//   const [allCandidates, setAllCandidates] = useState([]);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
//         console.log("this is all candidates:", res.data);
//         setAllCandidates(res.data);
//       } catch (err) {
//         console.error("Failed to fetch candidates:", err);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   if (!allCandidates || allCandidates.length === 0) return null;

//   return (
//     <div className="candidate-section" style={{ marginBottom: "2rem" }}>
//       <h3>Track All Your Politicians</h3>
//       <div className="candidate-grid">
//         {allCandidates.map((candidate) => (
//           <Link to={`/candidates/${candidate.id}`} key={candidate.id} className="candidate-card-link">
//             <div className="candidate-card">
//               <div className="image-wrapper">
//                 <img
//                   loading="lazy"
//                   src={candidate.photo_url}
//                   alt={candidate.name}
//                   className={`candidate-image ${
//                     candidate.stances?.averageScore == null
//                       ? "border-black"
//                       : candidate.stances.averageScore > 5
//                       ? "border-blue"
//                       : "border-red"
//                   }`}
//                 />
//                 <div
//                   className={`score-line ${
//                     candidate.stances?.averageScore == null
//                       ? "line-black"
//                       : candidate.stances.averageScore > 5
//                       ? "line-blue"
//                       : "line-red"
//                   }`}
//                 >
//                   <div
//                     className={`score-bubble ${
//                       candidate.stances?.averageScore == null
//                         ? "bubble-black"
//                         : candidate.stances.averageScore > 5
//                         ? "bubble-blue"
//                         : "bubble-red"
//                     }`}
//                   >
//                     {candidate.stances?.averageScore ?? "null"}
//                   </div>
//                 </div>
//               </div>
//               <div className="candidate-name">{candidate.name}</div>
//               <div className="candidate-position">{candidate.position}</div>
//             </div>
//           </Link>
//         ))}
        
//       </div>
//     </div>
//   );
// }

// export default CandidateGrid;




// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";

// function CandidateGrid({ title }) {
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
//         // Sort alphabetically or however you want to prioritize
//         const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
//         setAllCandidates(sorted.slice(0, 16)); // show top 16
//         setTimeout(() => {
//           setAllCandidates(sorted);            // load the rest
//           setLoading(false);                   // hide skeletons after full load
//         }, 200);
//       } catch (err) {
//         console.error("Failed to fetch candidates:", err);
//       } finally {
//       }
//     };

//     fetchCandidates();
//   }, []);

//   return (
//     <div className="candidate-section" style={{ marginBottom: "2rem" }}>
//       <h3>Track All Your Politicians</h3>

//       <div className="candidate-grid">
//         {(loading ? Array.from({ length: 12 }) : allCandidates).map((candidate, idx) =>
//           loading ? (
//             <div key={idx} className="candidate-card skeleton-card" />
//           ) : (
//             <Link to={`/candidates/${candidate.id}`} key={candidate.id} className="candidate-card-link">
//               <div className="candidate-card">
//                 <div className="image-wrapper">
//                   <img
//                     loading="lazy"
//                     src={candidate.photo_url}
//                     alt={candidate.name}
//                     className={`candidate-image ${
//                       candidate.stances?.averageScore == null
//                         ? "border-black"
//                         : candidate.stances.averageScore > 5
//                         ? "border-blue"
//                         : "border-red"
//                     }`}
//                   />
//                   <div
//                     className={`score-line ${
//                       candidate.stances?.averageScore == null
//                         ? "line-black"
//                         : candidate.stances.averageScore > 5
//                         ? "line-blue"
//                         : "line-red"
//                     }`}
//                   >
//                     <div
//                       className={`score-bubble ${
//                         candidate.stances?.averageScore == null
//                           ? "bubble-black"
//                           : candidate.stances.averageScore > 5
//                           ? "bubble-blue"
//                           : "bubble-red"
//                       }`}
//                     >
//                       {candidate.stances?.averageScore ?? "null"}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="candidate-name">{candidate.name}</div>
//                 <div className="candidate-position">{candidate.position}</div>
//               </div>
//             </Link>
//           )
//         )}
//       </div>
//     </div>
//   );
// }

// export default CandidateGrid;


// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";
// import LazyRenderWrapper from "./LazyRenderWrapper";


// function CandidateGrid({ title }) {
//   const [allCandidates, setAllCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
//         const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));
//         setAllCandidates(sorted);
//       } catch (err) {
//         console.error("Failed to fetch candidates:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   return (
//     <div className="candidate-section" style={{ marginBottom: "2rem" }}>
//       <h3>Track All Your Politicians</h3>

//       <div className="candidate-grid">
//         {(loading ? Array.from({ length: 12 }) : allCandidates).map((candidate, idx) =>
//           loading ? (
//             <div key={idx} className="candidate-card skeleton-card" />
//           ) : (
//             <LazyRenderWrapper key={candidate.id}>
//               <Link to={`/candidates/${candidate.id}`} className="candidate-card-link">
//                 <div className="candidate-card">
//                   <div className="image-wrapper">
//                     <img
//                       loading="lazy"
//                       src={candidate.photo_url}
//                       alt={candidate.name}
//                       className={`candidate-image ${
//                         candidate.stances?.averageScore == null
//                           ? "border-black"
//                           : candidate.stances.averageScore > 5
//                           ? "border-blue"
//                           : "border-red"
//                       }`}
//                     />
//                     <div
//                       className={`score-line ${
//                         candidate.stances?.averageScore == null
//                           ? "line-black"
//                           : candidate.stances.averageScore > 5
//                           ? "line-blue"
//                           : "line-red"
//                       }`}
//                     >
//                       <div
//                         className={`score-bubble ${
//                           candidate.stances?.averageScore == null
//                             ? "bubble-black"
//                             : candidate.stances.averageScore > 5
//                             ? "bubble-blue"
//                             : "bubble-red"
//                         }`}
//                       >
//                         {candidate.stances?.averageScore ?? "null"}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="candidate-name">{candidate.name}</div>
//                   <div className="candidate-position">{candidate.position}</div>
//                 </div>
//               </Link>
//             </LazyRenderWrapper>
//           )
//         )}
//       </div>
//     </div>
//   );
// }

// export default CandidateGrid;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";

// function CandidateGrid({ title }) {
//   const [allCandidates, setAllCandidates] = useState([]);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
//         console.log("this is all candidates:", res.data);
//         setAllCandidates(res.data);
//       } catch (err) {
//         console.error("Failed to fetch candidates:", err);
//       }
//     };

//     fetchCandidates();
//   }, []);

//   if (!allCandidates || allCandidates.length === 0) return null;

//   return (
//     <div className="candidate-section" style={{ marginBottom: "2rem" }}>
//       <h3>Track All Your Politicians</h3>
//       <div className="candidate-grid">
//         {allCandidates.map((candidate) => (
//           <Link to={`/candidates/${candidate.id}`} key={candidate.id} className="candidate-card-link">
//             <div className="candidate-card">
//               <div className="image-wrapper">
//                 <img
//                   loading="lazy"
//                   src={candidate.photo_url}
//                   alt={candidate.name}
//                   className={`candidate-image ${
//                     candidate.stances?.averageScore == null
//                       ? "border-black"
//                       : candidate.stances.averageScore > 5
//                       ? "border-blue"
//                       : "border-red"
//                   }`}
//                 />
//                 <div
//                   className={`score-line ${
//                     candidate.stances?.averageScore == null
//                       ? "line-black"
//                       : candidate.stances.averageScore > 5
//                       ? "line-blue"
//                       : "line-red"
//                   }`}
//                 >
//                   <div
//                     className={`score-bubble ${
//                       candidate.stances?.averageScore == null
//                         ? "bubble-black"
//                         : candidate.stances.averageScore > 5
//                         ? "bubble-blue"
//                         : "bubble-red"
//                     }`}
//                   >
//                     {candidate.stances?.averageScore ?? "null"}
//                   </div>
//                 </div>
//               </div>
//               <div className="candidate-name">{candidate.name}</div>
//               <div className="candidate-position">{candidate.position}</div>
//             </div>
//           </Link>
//         ))}
        
//       </div>
//     </div>
//   );
// }

// export default CandidateGrid;




import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LazyRenderWrapper from "./LazyRenderWrapper";

function CandidateGrid({ title }) {
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(16);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
        const sorted = res.data.sort((a, b) => a.name.localeCompare(b.name));

        setAllCandidates(sorted.slice(0, 16));

        const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
        idleCallback(() => {
          setAllCandidates(sorted); // Load all for scroll reveal
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
      }
    };

    fetchCandidates();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
      if (nearBottom) {
        setVisibleCount((prev) => Math.min(prev + 16, allCandidates.length));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allCandidates]);

  const displayed = loading ? Array.from({ length: 16 }) : allCandidates.slice(0, visibleCount);

  return (
    <div className="candidate-section" style={{ marginBottom: "2rem" }}>
      <h3>Track All Your Politicians</h3>

      <div className="candidate-grid">
        {displayed.map((candidate, idx) =>
          loading ? (
            <div key={idx} className="candidate-card skeleton-card" />
          ) : (
            <LazyRenderWrapper key={candidate.id}>
              <Link to={`/candidates/${candidate.id}`} className="candidate-card-link">
                <div className="candidate-card">
                  <div className="image-wrapper">
                    <img
                      loading="lazy"
                      src={`${import.meta.env.VITE_IMG_URL}${candidate.photo_url}`}
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
            </LazyRenderWrapper>
          )
        )}
      </div>
    </div>
  );
}

export default CandidateGrid;
