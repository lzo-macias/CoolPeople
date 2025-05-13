import React from 'react';
import HomeCarosoul from '../components/CandidateGrid';
import Intro from '../components/Intro';

function Home({ headerRef }) {
  const scrollToHeader = () => {
    if (headerRef?.current) {
      headerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-container">
      <Intro />
      <HomeCarosoul />
      <div className="bottom-center-wrapper">
        <h3 className="bottomheader">Haha just kidding</h3>
        <h3 className="bottomheader">Join the CoolPeople App and Vote When You Need Too</h3>
        <button className="bottombutton" onClick={scrollToHeader}>CoolPeople</button>
      </div>
    </div>
  );
}

export default Home;
