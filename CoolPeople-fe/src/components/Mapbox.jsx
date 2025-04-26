import React, { useEffect, useRef, useState } from "react";
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
  const [lng, setLng] = useState(-74.006); // Default: NYC
  const [lat, setLat] = useState(40.7128);
  const [zoom, setZoom] = useState(10);
  const [districtInfo, setDistrictInfo] = useState(null);
  const [inputAddress, setInputAddress] = useState("");

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
  
    geocoder.on('result', (e) => {
      const { center } = e.result;
      const [lng, lat] = center;
  
      marker.current.setLngLat([lng, lat]);
      map.current.flyTo({ center: [lng, lat], zoom: 14 });
  
      fetchDistrictByCoords(lat, lng);
    });
  }, []);
  

  const onDragEnd = async () => {
    const lngLat = marker.current.getLngLat();
    setLng(lngLat.lng);
    setLat(lngLat.lat);
    await fetchDistrictByCoords(lngLat.lat, lngLat.lng);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/lookup`, { address: inputAddress }); 
      if (res.data && res.data.lat && res.data.lng) {
        marker.current.setLngLat([res.data.lng, res.data.lat]);
        map.current.flyTo({ center: [res.data.lng, res.data.lat], zoom: 14 });
        setDistrictInfo(res.data);
      }
    } catch (err) {
      console.error("Address lookup error:", err);
    }
  };
  

  const fetchDistrictByCoords = async (lat, lng) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/lookup`, { address: `${lat},${lng}` });
      setDistrictInfo(res.data);
    } catch (err) {
      console.error("Coordinate lookup error:", err);
    }
  };

  return (
    <div>
      <div ref={mapContainer} style={{ height: "500px", width: "100%" }} />

      {districtInfo && (
        <div style={{ marginTop: "1rem" }}>
          <h3>District Info:</h3>
          <p><strong>Borough:</strong> {districtInfo.borough}</p>
          <p><strong>City Council District:</strong> {districtInfo.cityCouncilDistrict}</p>
          <p><strong>Latitude:</strong> {districtInfo.lat}</p>
          <p><strong>Longitude:</strong> {districtInfo.lng}</p>
        </div>
      )}
    </div>
  );
}

export default Mapbox;
