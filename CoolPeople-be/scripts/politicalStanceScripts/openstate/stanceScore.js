function stanceScore(sentence) {
    const progressivePhrases = ['progressive', 'equity', 'justice', 'abolish', 'defund', 'universal', 'guaranteed'];
    const conservativePhrases = ['tough on crime', 'zero tolerance', 'cut taxes', 'protect police', 'border security'];
  
    const l = sentence.toLowerCase();
    const pro = progressivePhrases.some(p => l.includes(p));
    const con = conservativePhrases.some(p => l.includes(p));
  
    if (pro && !con) return 5;
    if (!pro && con) return 1;
    if (pro && con) return 3;
    return 3; // neutral
  }

  const ENDORSEMENTS = {
    'Jenifer Rajkumar': {
      'Equality New York': true,
      'Planned Parenthood': true,
      'Stonewall Democrats': true
    },
    // more candidates...
  }

  const ORG_SCORES = {
    "Equality New York": 5,
    "Planned Parenthood Votes NY": 5,
    "Stonewall Democratic Club": 5,
    "NYCLU": 5,
    "New Pride Agenda": 5,
    "NRA": 1,
    "Police Benevolent Association": 2
  };

  function getEndorsementScore(candidateEndorsements) {
    if (!candidateEndorsements || candidateEndorsements.length === 0) return null;
  
    const scores = candidateEndorsements
      .map(org => ORG_SCORES[org])
      .filter(Boolean); // remove undefined
  
    if (scores.length === 0) return null;
    
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length); // average endorsement weight
  }

  function blendStanceScores(textScore, endorsementScore) {
    if (endorsementScore === null) return textScore; // no endorsements
    return Math.round(0.7 * textScore + 0.3 * endorsementScore);
  }