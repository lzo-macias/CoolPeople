import axios from "axios";
import React,  { useEffect, useState } from "react";
import { Routes, Route, useLocation, Link, useParams } from "react-router-dom";
import "./App.css";

import Header from "./components/Header";
import Home from "./pages/Home";
import MyBallots from "./pages/myballots";
import Register from "./pages/Register";
import Login from "./pages/Login";
import SingleCandidate from "./pages/SingleCandidate";

function App() {
  return (
    <>
    <div className="main-container">
      <Header />
    </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path = "/Myballots" element={<MyBallots/>}/>
        <Route path = "/Register" element={<Register/>}/>
        <Route path = "/Login" element ={<Login/>}/>
        <Route path = "/candidates/:id" element = {<SingleCandidate/>}/>
      </Routes>
    </>
  );
}

export default App
