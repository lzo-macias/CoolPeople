import { useEffect, useRef, useState } from "react";

function LazyRenderWrapper({ children }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      {
        rootMargin: "300px", // preload a bit before scroll
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{visible ? children : null}</div>;
}

export default LazyRenderWrapper;
