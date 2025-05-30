// Header.jsx
import React, { forwardRef } from "react";
import { Link } from "react-router-dom";

const Header = forwardRef((props, ref) => {
  return (
    <div className="header-container" ref={ref}>
      <div className="header">
        <div className="logo">
          <img src="/icons/logo3.png" alt="CoolPeople Logo" />
        </div>
        <Link>who we are</Link>
        <Link>how it works</Link>
        <Link>contact us</Link>
        <div className="loginandregister-links">
          <Link to="/login">
            <p className="login-link">Login</p>
          </Link>
          <Link to="https://e-register.vote.nyc/">
            <p className="register-link">Register</p>
          </Link>
        </div>
      </div>
    </div>
  );
});

export default Header;
