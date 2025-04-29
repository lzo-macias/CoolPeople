// src/utils/loadGoogleMaps.js
export function loadGoogleMapsScript(apiKey) {
    if (typeof window.google === 'object' && typeof window.google.maps === 'object') {
      // Already loaded
      return Promise.resolve();
    }
  
    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById('googleMaps');
  
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.id = 'googleMaps';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
  
        script.onload = () => {
          resolve();
        };
  
        script.onerror = () => {
          reject('Failed to load Google Maps script.');
        };
      } else {
        resolve();
      }
    });
  }
  