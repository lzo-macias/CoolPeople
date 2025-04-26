import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";


function Header() {
  return (
    <div className="header-container">
        <div className='header'>
            <div className='logo'><img src="/icons/logo3.png" alt="CoolPeople Logo"/></div>
                <Link>who we are</Link>
                <Link>how it works</Link>
                <Link>contact us</Link>
            <div className='loginandregister-links'>
                <p className='login-link'>Login</p>
                <p className='register-link'>Register</p>
            </div>
        </div>
    </div>


  )
}

export default Header