import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function Mapbox() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const navigate = useNavigate();
  const [lng, setLng] = useState(-74.006);
  const [lat, setLat] = useState(40.7128);
  const [zoom, setZoom] = useState(10);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
    });

    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([lng, lat])
      .addTo(map.current);

    marker.current.on("dragend", onDragEnd);

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: "Search for your address",
      marker: false,
    });

    map.current.addControl(geocoder);

    setTimeout(() => {
      const geocoderInput = document.querySelector('.mapboxgl-ctrl-geocoder input');
      if (geocoderInput) {
        geocoderInput.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter') {
            const address = geocoderInput.value;
            console.log('Enter key pressed. Address:', address);
            if (address) {
              try {
                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/lookup`, { address });
                if (res.data) {
                  localStorage.setItem('districtInfo', JSON.stringify(res.data));
                  navigate("/myballots");
                }
              } catch (err) {
                console.error("Address lookup error:", err);
              }
            }
          }
        });
      }
    }, 500);

    geocoder.on('result', (e) => {
      const { center } = e.result;
      const [lng, lat] = center;

      marker.current.setLngLat([lng, lat]);
      map.current.flyTo({ center: [lng, lat], zoom: 14 });

      // No navigation triggered here!
    });

  }, []);

  const onDragEnd = () => {
    const lngLat = marker.current.getLngLat();
    setLng(lngLat.lng);
    setLat(lngLat.lat);
  };

  return (
    <div>
      <div ref={mapContainer} style={{ height: "500px", width: "100%" }} />
    </div>
  );
}

export default Mapbox;
