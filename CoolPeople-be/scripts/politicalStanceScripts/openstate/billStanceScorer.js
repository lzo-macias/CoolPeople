// billStanceScorer.js
const stanceScore = require('./stanceScore');

function analyzeBills(bills = []) {
  return bills.map(bill => {
    const text = bill.title + ' ' + (bill.latest_action_description || '');
    const score = stanceScore(text);

    return {
      title: bill.title,
      url: bill.openstates_url,
      action: bill.latest_action_description,
      score
    };
  });
}

function summarizeTopBills(bills, topN = 5) {
  const sorted = [...bills].sort((a, b) => b.score - a.score);
  return sorted.slice(0, topN);
}

// Example Usage
if (require.main === module) {
  const exampleBills = [
    {
      title: 'Removes the prohibition on patient participation in multiple transplant programs in New York state',
      latest_action_description: 'REFERRED TO HEALTH',
      openstates_url: 'https://openstates.org/ny/bills/2025-2026/A7617/'
    },
    {
      title: 'Extends the authorization of the county of Rensselaer to impose an additional one percent of sales and compensating use taxes',
      latest_action_description: 'REFERRED TO INVESTIGATIONS AND GOVERNMENT OPERATIONS',
      openstates_url: 'https://openstates.org/ny/bills/2025-2026/S7294/'
    }
  ];

  const scored = analyzeBills(exampleBills);
  const top = summarizeTopBills(scored);

  console.log('🔝 Top Scored Bills:');
  console.dir(top, { depth: null });
}

module.exports = { analyzeBills, summarizeTopBills };
