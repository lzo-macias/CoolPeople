// import React, { useEffect, useRef } from 'react';
// // import './BouncingBalls.css';

// const ballsData = [
//   { className: 'ball ball1', url: '/page1', label: 'Page 1' },
//   { className: 'ball ball2', url: '/page2', label: 'Page 2' },
//   { className: 'ball ball3', url: '/page3', label: 'Page 3' },
//   { className: 'ball ball4', url: '/page4', label: 'Page 4' },
//   { className: 'ball ball5', url: '/page5', label: 'Page 5' },
//   { className: 'ball ball6', url: '/page6', label: 'Page 6' },
// ];

// const BouncingBalls = () => {
//   const containerRef = useRef(null);
//   const ballRefs = useRef([]);

//   useEffect(() => {
//     const container = containerRef.current;
//     const velocities = ballsData.map(() => ({
//       vx: (Math.random() - 0.5) * 4,
//       vy: (Math.random() - 0.5) * 4,
//     }));

//     const animate = () => {
//       ballRefs.current.forEach((ball, i) => {
//         if (!ball) return;
//         const rect = ball.getBoundingClientRect();
//         const containerRect = container.getBoundingClientRect();

//         let x = ball.offsetLeft + velocities[i].vx;
//         let y = ball.offsetTop + velocities[i].vy;

//         if (x < 0 || x + 60 > container.clientWidth) velocities[i].vx *= -1;
//         if (y < 0 || y + 60 > container.clientHeight) velocities[i].vy *= -1;

//         ball.style.left = `${ball.offsetLeft + velocities[i].vx}px`;
//         ball.style.top = `${ball.offsetTop + velocities[i].vy}px`;
//       });

//       requestAnimationFrame(animate);
//     };

//     animate();
//   }, []);

//   return (
//     <div className="ball-container" ref={containerRef}>
//       {ballsData.map((ball, index) => (
//         <div
//           key={index}
//           className={ball.className}
//           ref={(el) => (ballRefs.current[index] = el)}
//           onClick={() => window.open(ball.url, '_blank')}
//         >
//           {ball.label}
//         </div>
//       ))}
//     </div>
//   );
// };

import React, { useEffect, useRef } from 'react';
// import './BouncingBalls.css';

const ballsData = [
  { className: 'ball ball1', url: '/page1', label: 'Page 1' },
  { className: 'ball ball2', url: '/page2', label: 'Page 2' },
  { className: 'ball ball3', url: '/page3', label: 'Page 3' },
  { className: 'ball ball4', url: '/page4', label: 'Page 4' },
  { className: 'ball ball5', url: '/page5', label: 'Page 5' },
  { className: 'ball ball6', url: '/page6', label: 'Page 6' },
];

const BouncingBalls = () => {
    const containerRef = useRef(null);
    const ballRefs = useRef([]);
    const velocities = useRef([]);
    const positions = useRef([]);
    const paused = useRef([]);
  
    useEffect(() => {
      const container = containerRef.current;
      const gravity = 0.07;
      const width = container.clientWidth;
      const height = container.clientHeight;
  
      const startingYs = ballsData.map(() => height - 60);
  
      velocities.current = ballsData.map(() => ({
        vx: 0,
        vy: 0,
      }));

      positions.current = ballsData.map((_, i) => ({
        x: Math.random() * (width - 60),
        y: startingYs[i],
      }));
      
      ballsData.forEach((_, i) => {
        const ball = ballRefs.current[i];
        if (ball) {
          ball.style.left = `${positions.current[i].x}px`;
          ball.style.top = `${positions.current[i].y}px`;
        }
      });
  
paused.current = ballsData.map(() => true);
// Stagger initial throws
const launchDelays = [0, 0, 0, 0, 0, 0]; // ms delay per ball

ballsData.forEach((_, i) => {
  setTimeout(() => {
    velocities.current[i].vy = -Math.random() * 7 - 3;
    velocities.current[i].vx = (Math.random() - 0.5) * 2;
    paused.current[i] = false;
  }, launchDelays[i] || 0);
});
  
const animate = () => {
    ballRefs.current.forEach((ball, i) => {
      if (!ball || paused.current[i]) {
        if (ball) ball.classList.add('paused');
        return;
      } else {
        ball.classList.remove('paused');
      }
  
      velocities.current[i].vy += gravity;
      positions.current[i].x += velocities.current[i].vx;
      positions.current[i].y += velocities.current[i].vy;
  
      // Wrap horizontally
    //   if (positions.current[i].x < -60) positions.current[i].x = width;
    //   if (positions.current[i].x > width) positions.current[i].x = -60;
  
      // If it lands, pause and wait before next throw
      if (positions.current[i].y > startingYs[i]) {
        positions.current[i].y = startingYs[i];
        velocities.current[i].vy = 0;
        velocities.current[i].vx = 0;
        paused.current[i] = true;
        ball.classList.add('paused');
  
        // Wait 1–3 seconds, then re-throw
        const wait = Math.random() * 1 + 50;
        setTimeout(() => {
            const centerX = width / 2;
            const xPos = positions.current[i].x;
            const direction = centerX - xPos; // positive if left of center, negative if right
            
            // Normalize direction (-1 to 1)
            const normalized = direction / centerX;
            
            // Scale factor: randomly varies horizontal force strength
            const strength = Math.random() * 5.5 + 2.5; // range: 0.5 to 3.0
            
            // Add even more variety with random offset
            const randomness = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75
            
            // Final horizontal velocity
            velocities.current[i].vx = normalized * strength + randomness;
            
            // Vertical velocity (keep as is)
            velocities.current[i].vy = -Math.random() * 9 - 3;
            
            paused.current[i] = false;
            ball.classList.remove('paused');
        }, wait);
  
        return;
      }
  
      // Apply visual position
      ball.style.left = `${positions.current[i].x}px`;
      ball.style.top = `${positions.current[i].y}px`;
    });
  
    requestAnimationFrame(animate);
  };
  
  
      animate();
    }, []);
  
    return (
      <div className="ball-container" ref={containerRef}>
        {ballsData.map((ball, index) => (
          <div
            key={index}
            className={ball.className}
            ref={(el) => (ballRefs.current[index] = el)}
            onClick={() => window.open(ball.url, '_blank')}
          >
            {ball.label}
          </div>
        ))}
      </div>
    );
  };
  
  export default BouncingBalls;