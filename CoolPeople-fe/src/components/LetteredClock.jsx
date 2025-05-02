import React, { useEffect, useState } from "react";

const CountdownClock = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const deadline = new Date("May 30, 2025 23:59:59").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clock-container">
      <h1 className="clock-header">NYC LOCAL ELECTIONS REGISTRATION DEADLINE</h1>
      <div className="clock-timer">
        <div className="clock-unit">
          <span className="clock-value">
            {timeLeft.days}
            <span className="colon">:</span>
          </span>
          <span className="clock-label">Day(s)</span>
        </div>
        <div className="clock-unit">
          <span className="clock-value">
            {String(timeLeft.hours).padStart(2, "0")}
            <span className="colon">:</span>
          </span>
          <span className="clock-label">Hour(s)</span>
        </div>
        <div className="clock-unit">
          <span className="clock-value">
            {String(timeLeft.minutes).padStart(2, "0")}
            <span className="colon">:</span>
          </span>
          <span className="clock-label">Minute(s)</span>
        </div>
        <div className="clock-unit">
          <span className="clock-value">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="clock-label">Second(s)</span>
        </div>
      </div>
      {/* <h2 className="clock-containerblurb">Only 20% of people vote in Local Elections, dont miss out and register to vote today, then track your candidates on the CoolPeople app</h2> */}
    </div>
  );
};

export default CountdownClock;
