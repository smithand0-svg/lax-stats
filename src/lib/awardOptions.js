// Suggestion lists for the TM-18 awards admin form, NOT validated enums
// -- honor_source and honor_label have no DB constraint (see
// db/024_season_honors.sql) because the full set of sources (OHSAA
// especially) isn't fully known yet. These just seed the form's
// <datalist>s so common values autocomplete without blocking a new one
// from being typed.
const KNOWN_SOURCES = ['League (CHSL)', 'OHSLCA - Region', 'OHSLCA - State', 'USA Lacrosse', 'OHSAA'];

const POSITIONS = ['Attack', 'Midfield', 'Defense', 'FOGO', 'Goalie', 'Defensive Midfielder', 'LSM'];

// Per-source label suggestions -- not exhaustive, not enforced, just
// what pre-fills the honor-label datalist when a known source is
// selected. Coach-only labels (Coach of the Year, Assistant Coach of
// the Year) are deliberately excluded -- TM-18 is player-only; those
// belong to the staff-awards ticket (TM-37).
const LABEL_SUGGESTIONS_BY_SOURCE = {
  'League (CHSL)': ['CHSL - All Catholic', 'CHSL - All League', 'CHSL - All Academic'],
  'OHSLCA - Region': [
    'Position Player of the Year',
    '1st Team All-Region',
    '2nd Team All-Region',
    'Honorable Mention All-Region',
    'Player of the Year',
    'Man of the Year',
  ],
  'OHSLCA - State': [
    'Position Player of the Year',
    '1st Team All-State',
    '2nd Team All-State',
    '3rd Team All-State',
    'Honorable Mention All-State',
    'Player of the Year',
    'Man of the Year',
  ],
  'USA Lacrosse': ['All-American', 'Academic All-American', 'Bob Scott Award'],
};

module.exports = { KNOWN_SOURCES, POSITIONS, LABEL_SUGGESTIONS_BY_SOURCE };
