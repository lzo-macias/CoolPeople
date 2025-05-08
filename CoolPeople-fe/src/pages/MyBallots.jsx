import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CandidateCarousel from '../components/CandidateCarousel';
import SmallCountdownClock from '../components/LetteredClockSmall';
import BouncingBalls from '../components/BouncingBallot';

function MyBallots() {
  const [districtInfo, setDistrictInfo] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);

  useEffect(() => {
    const userinfo = localStorage.getItem('user');
    const tempinfo = localStorage.getItem('districtInfo');
    
    if (userinfo) {
      const parsedUser = JSON.parse(userinfo);
      const district = {
        borough: parsedUser.borough,
        cityCouncilDistrict: parsedUser.cityCouncilDistrict,
      };
      setDistrictInfo(district);
    } else if (tempinfo) {
      setDistrictInfo(JSON.parse(tempinfo));
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

      <CandidateCarousel title="Mayor" candidates={mayorCandidates} />
      <CandidateCarousel title="Public Advocate" candidates={publicAdvocateCandidates} />
      <CandidateCarousel title="Comptroller" candidates={comptrollerCandidates} />
      <CandidateCarousel title={`Borough President (${districtInfo.borough})`} candidates={boroughPresidentCandidates} />
      <CandidateCarousel title={`City Council (District ${districtInfo.cityCouncilDistrict})`} candidates={cityCouncilCandidates} />
    {/* <SmallCountdownClock/> */}
    {/* <span role="img" aria-label="trophy">🏆</span> */}
    {/* <BouncingBalls/> */}
    </>
  );
}

export default MyBallots;
