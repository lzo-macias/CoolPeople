import React from 'react'
import HomeCarosoul from '../components/CandidateGrid'
import Mapbox from '../components/Mapbox'
import LetteredClock from '../components/LetteredClock'
import CandidateCarousel from '../components/CandidateCarousel'
import Intro from '../components/Intro'
import IdeologySlider from '../components/Ideologyslider'
import IssueSelector from '../components/IssueSelector'

function Home() {
  return (
    <div className='home-container'>
        {/* <h2>are you REGISTERED to VOTE this nov 4th</h2> */}
        {/* <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <IdeologySlider onChange={(val) => console.log("Selected:", val)} />
      </div>
      <div className="mt-10">
      <IssueSelector onSave={(prefs) => console.log("Saved:", prefs)} />
    </div> */}
         <Intro/>

        {/* <LetteredClock/> */}
         <HomeCarosoul/>
    </div>


  )
}

export default Home