import axios from "axios";
import React,  { useEffect, useState } from "react";
import { Routes, Route, useLocation, Link, useParams } from "react-router-dom";
import "./App.css";

import Header from "./components/Header";
import Home from "./pages/Home";
import MyBallots from "./pages/myballots";
import Register from "./pages/Register";

function App() {
  return (
    <>
    <div className="main-container">
      <Header />
    </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path = "/myballots" element={<MyBallots/>}/>
        <Route path = "/Register" element={<Register/>}/>
      </Routes>
    </>
  );
}

export default App
