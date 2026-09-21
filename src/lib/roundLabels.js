// Playoff round values are 64/32/16/8/4/2 (games remaining), 2 = championship.
// Named rounds match the labels already used elsewhere on the site (e.g.
// Season History's BC Notes column: Sweet 16, Elite 8, Final 4).
const ROUND_LABELS = {
  64: 'Round of 64',
  32: 'Round of 32',
  16: 'Sweet 16',
  8: 'Elite 8',
  4: 'Final 4',
  2: 'Championship',
};

module.exports = { ROUND_LABELS };
