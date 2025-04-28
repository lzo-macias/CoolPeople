import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CandidateCarousel from '../components/CandidateCarousel';

function MyBallots() {
  const [districtInfo, setDistrictInfo] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);

  useEffect(() => {
    const storedInfo = localStorage.getItem('districtInfo');
    if (storedInfo) {
      setDistrictInfo(JSON.parse(storedInfo));
    }

    const fetchCandidates = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/candidates`);
          console.log("this is all candidates:", res.data); // 👈 LOG THE ACTUAL RESPONSE HERE
          setAllCandidates(res.data);
        } catch (err) {
          console.error("Failed to fetch candidates:", err);
        }
      };

    fetchCandidates();
  }, []);

  if (!districtInfo) {
    return <p>Loading your ballot info...</p>;
  }

  // ✨ Split into sections
  const mayorCandidates = allCandidates.filter(c => c.position && c.position.toLowerCase().includes('mayor'));
  console.log("mayor",mayorCandidates);
  const publicAdvocateCandidates = allCandidates.filter(c => c.position && c.position.toLowerCase().includes('public advocate'));
  console.log("public advocate",publicAdvocateCandidates)
  const comptrollerCandidates = allCandidates.filter(c => c.position && c.position.toLowerCase().includes('comptroller'));
  console.log("comptroller",comptrollerCandidates)
  const boroughPresidentCandidates = allCandidates.filter(c => 
    c.position && 
    c.position.toLowerCase().includes('boro president') &&
    c.position.toLowerCase().includes(districtInfo.borough.toLowerCase())
  );
  console.log("boro president", boroughPresidentCandidates)
  const cityCouncilCandidates = allCandidates.filter(c => {
    if (!c.position) return false;
  
    const normalizedPosition = c.position
      .toLowerCase()
      .trim();
  
    const match = normalizedPosition.match(/city council district (\d{1,3})/); // match 1–3 digits
  
    if (!match) return false;
  
    const candidateDistrict = match[1].padStart(2, '0'); // ✅ Always 2 digits
    const userDistrict = districtInfo.cityCouncilDistrict.padStart(2, '0'); // ✅ Always 2 digits
  
    return candidateDistrict === userDistrict;
  });
  
  
  
  

  console.log("citycouncil", cityCouncilCandidates)

  return (
    <>
      <h2>Your 2025 NYC Ballots</h2>

      <CandidateCarousel title="Mayor" candidates={mayorCandidates} />
      <CandidateCarousel title="Public Advocate" candidates={publicAdvocateCandidates} />
      <CandidateCarousel title="Comptroller" candidates={comptrollerCandidates} />
      <CandidateCarousel title={`Borough President (${districtInfo.borough})`} candidates={boroughPresidentCandidates} />
      <CandidateCarousel title={`City Council (District ${districtInfo.cityCouncilDistrict})`} candidates={cityCouncilCandidates} />
    </>
  );
}

export default MyBallots;
