import React, { useState, useEffect, forwardRef } from "react";
import axios from "axios";
import PlacesAutocomplete from "react-places-autocomplete";
import { loadGoogleMapsScript } from "../components/LoadGoogleMaps";
import { Navigate, useNavigate } from "react-router-dom";

function Intro() {
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [error, setError] = useState("");
  const [mapsReady, setMapsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadGoogleMapsScript(import.meta.env.VITE_GOOGLEMAPS_API_KEY)
      .then(() => setMapsReady(true))
      .catch((err) => console.error("Google Maps failed to load", err));
  }, []);

  const handleLookup = async () => {
    try {
      setLoading(true);
      setError("");

      const fullAddress = `${address}, ${zipCode}`;
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/lookup`, { address: fullAddress });

      if (res.data?.borough && res.data?.cityCouncilDistrict) {
        localStorage.setItem("districtInfo", JSON.stringify({
          borough: res.data.borough,
          cityCouncilDistrict: res.data.cityCouncilDistrict
        }));
        setLookupResult(res.data);
        navigate("/Myballots")
      } else {
        throw new Error("Invalid lookup result");
      }
    } catch (err) {
      console.error(err);
      setError("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className ="intro-container">
  {/* <div className="sticker-wrapper">
    <img src="/icons/DidYouVoteYet.png" alt="Did You Vote?" className="vote-sticker" />
  </div> */}
        <div className="intro-text">
        <h2>Voting How it Should be</h2>
        <h4>
          get ballots sent to your home, and live updates on representative activities,  notifications for quick and eazy engagment in politics 
        </h4>
        <div className="lookup-form">
          <div className="addysearch">
          <label>Address (Search):</label>
          {mapsReady ? (
          <PlacesAutocomplete
            value={address}
            onChange={setAddress}
            onSelect={setAddress}
            searchOptions={{
              types: ["address"],
              componentRestrictions: { country: ["us"] },
            }}
          >
            {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
              <div>
                <input
                  {...getInputProps({
                    placeholder: "Enter your address",
                    className: "location-search-input",
                  })}
                  required
                />
                <div className="autocomplete-dropdown-container">
                  {loading && <div>Loading...</div>}
                  {suggestions.map((suggestion, index) => {
                    const className = suggestion.active
                      ? "suggestion-item--active"
                      : "suggestion-item";
                    return (
                      <div {...getSuggestionItemProps(suggestion, { className })}>
                        <span>{suggestion.description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </PlacesAutocomplete>
        ) : (
          <p>Loading Google Maps...</p>
        )}
          </div>
          <div className="zippy">
            <label>Zip Code:</label>
            <input
              type="text"
               value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter your zip code"
              className="zip-input"
/>
          </div>
        <button onClick={handleLookup} disabled={loading}>
          {loading ? "Looking up..." : "Track my Politicians"}
        </button>

        {error && <p className="error-message">{error}</p>}
        {lookupResult && (
          <p className="success-message">
            Borough: {lookupResult.borough}, District: {lookupResult.cityCouncilDistrict}
          </p>
        )}
      </div>
      </div>
      <div className="intro-imgs">
        <div className="stacked-images">
          <img src="/icons/logocartoon.png" alt="" />
          <img src="/images/intro/dashboard.png" alt="" />
        </div>
          <img src="/images/intro/news.png" alt="" className="news-img" />
        </div>
</div>
  );
}

export default Intro;


