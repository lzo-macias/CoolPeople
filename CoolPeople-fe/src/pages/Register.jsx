import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PlacesAutocomplete from 'react-places-autocomplete';
import { loadGoogleMapsScript } from "../components/LoadGoogleMaps";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [dob, setDob] = useState("");
  const [borough, setBorough] = useState("");
  const [cityCouncilDistrict, setCityCouncilDistrict] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript(import.meta.env.VITE_GOOGLEMAPS_API_KEY)
      .then(() => {
        setMapsReady(true);
      })
      .catch((err) => {
        console.error("Google Maps failed to load", err);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
  
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
  
    setLoading(true);
  
    try {
      const fullAddress = `${address}, ${zipCode}`; // 🧠 add zipcode here
  
      const lookupRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/lookup`, { 
        address: fullAddress 
      });
  
      if (lookupRes.data) {
        setBorough(lookupRes.data.borough);
        setCityCouncilDistrict(lookupRes.data.cityCouncilDistrict);
      } else {
        throw new Error("Failed to lookup address.");
      }
  
      const registerRes = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/users/register`,
        {
          email,
          password,
          full_name: fullName,
          borough: lookupRes.data.borough,
          cityCouncilDistrict: lookupRes.data.cityCouncilDistrict,
          address,
          zip_code: zipCode,
          dob,
        }
      );
  
      if (registerRes.data.token) {
        localStorage.setItem("token", registerRes.data.token);
        localStorage.setItem("districtInfo", JSON.stringify({ 
          borough: lookupRes.data.borough, 
          cityCouncilDistrict: lookupRes.data.cityCouncilDistrict 
        }));
        setSuccess(true);
        alert("Registration successful!");
        navigate("/myballots");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div className="signup_main_container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label>Full Name:</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

<label>Address (Search):</label>

{mapsReady ? ( // ✅ only render once Google Maps is ready
  <PlacesAutocomplete
    value={address}
    onChange={setAddress}
    onSelect={(selected) => setAddress(selected)}
    searchOptions={{
      types: ['address'],
      componentRestrictions: { country: ['us'] }
    }}
  >
    {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
      <div>
        <input
          {...getInputProps({
            placeholder: '',
            className: 'location-search-input',
          })}
          required
        />
        <div className="autocomplete-dropdown-container">
          {loading && <div>Loading...</div>}
          {suggestions.map((suggestion, index) => {
            const className = suggestion.active
              ? 'suggestion-item--active'
              : 'suggestion-item';
            return (
              <div
                {...getSuggestionItemProps(suggestion, { className })}
              >
                <span>{suggestion.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </PlacesAutocomplete>
) : (
  <div>Loading address autocomplete...</div> // ✅ optional loading text while Google Maps is loading
)}


        <label>Zip Code:</label>
        <input
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
        />

        <label>Date of Birth:</label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          required
        />

        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label>Confirm Password:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading} className="btn">
          {loading ? "Registering..." : "Submit"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">Registration successful! Redirecting...</p>}
    </div>
  );
}

export default Register;
