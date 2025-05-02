import React from 'react'
import HomeCarosoul from '../components/CandidateGrid'
import Mapbox from '../components/mapbox'
import LetteredClock from '../components/LetteredClock'
import CandidateCarousel from '../components/CandidateCarousel'

function Home() {
  return (
    <div className='home-container'>
        {/* <h2>are you REGISTERED to VOTE this nov 4th</h2> */}
        <LetteredClock/>
         <HomeCarosoul/>
        {/* <h2 className='trackyourlocal'>Track your local Representatives</h2>
        <h2 className='eneteraddress'>Enter Your Address</h2><img src="./icons/DidYouVoteYet.png" alt="" />
        <Mapbox/> */}
    </div>
  )
}

export default Home