import React, { useState } from "react";
import "../App.css";

function IdeologySlider({ onChange }) {
  const [value, setValue] = useState(5);

  const handleChange = (e) => {
    const newVal = parseInt(e.target.value);
    setValue(newVal);
    if (onChange) onChange(newVal);
  };

  return (
    <div className="slider-wrapper">
      <label className="slider-title">Where do you fall politically?</label>
      {/* <div className="slider-labels">
        <span className="left-label">conservative</span>
        <span className="right-label">progressive</span>
      </div> */}
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        onChange={handleChange}
        className="gradient-slider"
      />


    </div>
  );
}

export default IdeologySlider;
