import React from 'react'
import HomeCarosoul from '../components/CandidateGrid'
import Mapbox from '../components/mapbox'
import LetteredClock from '../components/LetteredClock'
import CandidateCarousel from '../components/CandidateCarousel'
import Intro from '../components/Intro'

function Home() {
  return (
    <div className='home-container'>
        {/* <h2>are you REGISTERED to VOTE this nov 4th</h2> */}
        <Intro/>

        {/* <LetteredClock/> */}
         <HomeCarosoul/>
    </div>


  )
}

export default Home