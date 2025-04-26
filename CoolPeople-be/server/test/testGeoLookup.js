const geoLookup = require("../api/geolookup");

// console.log('typeof geoLookup:', typeof geoLookup); // 👀 Should be "function"


(async () => {
  const result = await geoLookup('401 1st ave, New York, NY 10010');
  console.log(result);
})();

//form query will have to be specific gathering exact addresses
