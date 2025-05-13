import "./App.css";
// App.jsx
import React, { useRef } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import MyBallots from "./pages/MyBallots";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SingleCandidate from "./pages/SingleCandidate";

function App() {
  const headerRef = useRef(null);

  return (
    <>
      <div className="main-container">
        <Header ref={headerRef} />
      </div>
      <Routes>
        <Route path="/" element={<Home headerRef={headerRef} />} />
        <Route path="/Myballots" element={<MyBallots />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/candidates/:id" element={<SingleCandidate />} />
      </Routes>
    </>
  );
}

export default App;
