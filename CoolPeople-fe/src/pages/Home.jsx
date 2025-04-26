import React from 'react'
import HomeCarosoul from '../components/homecarosoul'
import Mapbox from '../components/mapbox'

function Home() {
  return (
    <div className='home-container'>
        <h2>are you REGISTERED to VOTE this nov 4th</h2>
        <HomeCarosoul/>
        <h2>Track your local Representatives</h2>
        <h2>Enter Your Address</h2><img src="./icons/DidYouVoteYet.png" alt="" />
        <Mapbox/>
    </div>
  )
}

export default Home