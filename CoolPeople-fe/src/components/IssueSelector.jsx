import React, { useState, useEffect } from "react";
// import './App.css'

const issues = [
  { key: "Affordable Housing", icon: "/icons/house.png" },
  { key: "Policing & Public Safety", icon: "/icons/police.png" },
  { key: "Education", icon: "/icons/education.png" },
  { key: "Public Transit", icon: "/icons/rail.png" },
  { key: "Climate & Environment", icon: "/icons/global-warming.png" },
  { key: "Immigration", icon: "/icons/passport.png" },
  { key: "LGBTQ+ Rights", icon: "/icons/progress.png" },
  { key: "Economic Development", icon: "/icons/money.png" },
  { key: "Homelessness", icon: "/icons/dreaming.png" },
  { key: "Health Care Access", icon: "/icons/medical-team.png" },
  { key: "Veterans & Military", icon: "/icons/soldier.png" },
  { key: "Government & Ethics", icon: "/icons/enforcement.png" },
  { key: "Elections & Democracy", icon: "/icons/vote.png" },
  { key: "Civil Rights & Discrimination", icon: "/icons/civil-rights.png" },
];

export default function IssueSelector({ onSave }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("userIssuePreferences") || "[]");
    setSelected(saved);
  }, []);

  const toggleCategory = (category) => {
    setSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = () => {
    localStorage.setItem("userIssuePreferences", JSON.stringify(selected));
    if (onSave) onSave(selected);
    alert("Preferences saved!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Select Your Top Issues</h2>

      <div className="flex flex-wrap gap-4 justify-center">
        {issues.map(({ key, icon }) => (
          <div
            key={key}
            onClick={() => toggleCategory(key)}
            className={`cursor-pointer w-32 h-32 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm border 
              transition-all duration-200 ${
                selected.includes(key)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 hover:border-gray-400"
              }`}
          >
            <img src={icon} alt={key} className="w-10 h-10 mb-2 issue-icon" />
            <span className="text-sm font-medium">{key}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={handleSave}
          className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
