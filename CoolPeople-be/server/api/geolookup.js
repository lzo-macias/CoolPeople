// const axios = require('axios');
// require('dotenv').config();

// const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
// const GEOCLIENT_SUBSCRIPTION_KEY = process.env.GEOCLIENT_SUBSCRIPTION_KEY;

// async function geoLookup(address = '123 W 125th St, New York, NY') {
//   try {
//     // Step 1: Geocode with OpenCage to extract parts of the address
//     const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
//       params: {
//         q: address,
//         key: OPENCAGE_API_KEY,
//         countrycode: 'us',
//         limit: 1,
//         no_annotations: 1,
//       }
//     });

//     const results = geoRes.data?.results;
//     if (!results || results.length === 0) {
//       throw new Error('No geocoding results returned.');
//     }

//     const { geometry, components } = results[0];
//     console.log('📦 OpenCage components:', components);
//     const { lat, lng } = geometry;

//     // Parse components
//     const houseNumber = components.house_number || components.house || null;
//     const street =
//       components.road ||
//       components.street ||
//       components.residential ||
//       components.pedestrian ||
//       components.footway ||
//       null;

//     let borough =
//       components.borough ||
//       components.suburb ||
//       components.city_district ||
//       components.city ||
//       null;

//     // Normalize boroughs
//     if (borough === 'New York') borough = 'Manhattan';
//     if (borough === 'Kings County') borough = 'Brooklyn';
//     if (borough === 'Richmond County') borough = 'Staten Island';
//     if (borough === 'Queens County') borough = 'Queens';
//     if (borough === 'Bronx County') borough = 'Bronx';

//     // Fallback: if no borough but city is "New York", assume Manhattan
//     if (!borough && components.city === 'New York') {
//       borough = 'Manhattan';
//     }

//     if (!houseNumber || !street || !borough) {
//       throw new Error(`Missing components for GeoClient: houseNumber="${houseNumber}", street="${street}", borough="${borough}"`);
//     }

//     // Step 2: Get City Council District using NYC GeoClient
//     const geoClientRes = await axios.get('https://api.nyc.gov/geo/geoclient/v1/address.json', {
//       params: {
//         houseNumber,
//         street,
//         borough,
//       },
//       headers: {
//         'Ocp-Apim-Subscription-Key': GEOCLIENT_SUBSCRIPTION_KEY,
//       }
//     });
//     console.log("🌍 GeoClient full response:", geoClientRes.data);


//     const cityCouncilDistrict = geoClientRes.data?.address?.cityCouncilDistrict || null;

//     return {
//       borough,
//       lat,
//       lng,
//       cityCouncilDistrict,
//     };
//   } catch (err) {
//     console.error('Error in geoLookup:', err.response?.data || err.message);
//     return null;
//   }
// }

// module.exports = geoLookup;
const axios = require('axios');
require('dotenv').config();

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
const GEOCLIENT_SUBSCRIPTION_KEY = process.env.GEOCLIENT_SUBSCRIPTION_KEY;

async function geoLookup(address = '123 W 125th St, New York, NY') {
  try {
    // Step 1: Geocode with OpenCage
    const geoRes = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: address,
        key: OPENCAGE_API_KEY,
        countrycode: 'us',
        limit: 1,
        no_annotations: 1,
        proximity: '40.7580,-73.9855' // Force closer to Manhattan
      }
    });

    const results = geoRes.data?.results;
    if (!results || results.length === 0) {
      throw new Error('No geocoding results returned.');
    }

    const { geometry, components } = results[0];
    console.log('📦 OpenCage components:', components);
    const { lat, lng } = geometry;

    const houseNumber = components.house_number || components.house || null;
    const street =
      components.road ||
      components.street ||
      components.residential ||
      components.pedestrian ||
      components.footway ||
      null;

    let borough =
      components.borough ||
      components.suburb ||
      components.city_district ||
      components.city ||
      null;

    // Normalize from county if needed
    if (!borough && components.county) {
      const county = components.county;
      if (county.includes("New York")) borough = "Manhattan";
      else if (county.includes("Kings")) borough = "Brooklyn";
      else if (county.includes("Queens")) borough = "Queens";
      else if (county.includes("Bronx")) borough = "Bronx";
      else if (county.includes("Richmond")) borough = "Staten Island";
    }

    // Fallback if still not found
    if (!borough && components.city === "New York") {
      borough = "Manhattan";
    }

    // Final normalization
    if (borough === 'New York') borough = 'Manhattan';
    if (borough === 'New York County') borough = 'Manhattan';
    if (borough === 'Kings County') borough = 'Brooklyn';
    if (borough === 'Richmond County') borough = 'Staten Island';
    if (borough === 'Queens County') borough = 'Queens';
    if (borough === 'Bronx County') borough = 'Bronx';

    // 🧠 New Borough Validation
    const validBoroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
    if (!borough || !validBoroughs.includes(borough)) {
      throw new Error(`Address is not in New York City boroughs. (borough="${borough}")`);
    }

    if (!houseNumber || !street) {
      throw new Error(`Missing components for GeoClient: houseNumber="${houseNumber}", street="${street}"`);
    }

    // Step 2: Call NYC GeoClient
    const geoClientRes = await axios.get('https://api.nyc.gov/geo/geoclient/v1/address.json', {
      params: {
        houseNumber,
        street,
        borough,
      },
      headers: {
        'Ocp-Apim-Subscription-Key': GEOCLIENT_SUBSCRIPTION_KEY,
      }
    });
    console.log("🌍 GeoClient full response:", geoClientRes.data);

    const cityCouncilDistrict = geoClientRes.data?.address?.cityCouncilDistrict || null;

    return {
      borough,
      lat,
      lng,
      cityCouncilDistrict,
    };
  } catch (err) {
    console.error('Error in geoLookup:', err.response?.data || err.message);
    return null;
  }
}

module.exports = geoLookup;
