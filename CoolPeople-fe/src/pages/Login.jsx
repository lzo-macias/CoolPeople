// Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login({ setToken, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); // ✅ email instead of username
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/users/login`,
        { email, password }, // ✅ send email
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.token) {
        console.log("✅ Login response:", response.data);

        setToken && setToken(response.data.token);
        localStorage.setItem("token", response.data.token);

        // Save user info (you can save more fields if you want)
        const { id, email, full_name, borough, cityCouncilDistrict } = response.data;
        localStorage.setItem("user", JSON.stringify({ id, email, full_name, borough, cityCouncilDistrict }));

        alert("Login Successful!");
        setIsLoggedIn && setIsLoggedIn(true);
        navigate("/MyBallots");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  }

  return (
    <div className="login_main_container card">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Email: {/* ✅ label updated */}
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}

export default Login;
