// TM-43: Coaching Matrix baseline, transcribed from Andy's
// SJJ_Coaching_Matrix.xlsx exactly as provided (2026-09-23), covering every
// head-coach season through 2026. Opponent names are kept as written in
// the spreadsheet; the page canonicalizes them through the opponent
// lookup at render time so they merge with live games.
//
// Everything from the first auto_record season on (2027+) is calculated
// live from imported game results instead (src/lib/coachingMatrix.js).
// Seasons before that are covered by this baseline, and ONLY by it, so
// no game is ever counted twice.
//
// 2002-2006 (Chad Fredericks 2002, Jim Reed 2003-2006) added the same
// day from Game_History.xlsx, game by game, with playoff games
// identified from its Playoff Game Details tab. 2002-2005 reconcile
// exactly with Season History. 2006 has 20 games (12-8) in Game History
// against 13-9 in Season History: two games (one W, one L) have no
// game-level record, so they are not included. One unscored 2002
// Sylvania game is excluded, as Season History excludes it too.
// Opponent spellings were normalized to the names used elsewhere in
// this file. "Toledo Wolfpack" is its real name
// (confirmed by Andy): a combined team for Toledo players whose own
// schools have no lacrosse program. The plain "St
// Charles" game (4/10/2005, IL DuPage) is St. Charles, Illinois, kept
// separate from Columbus St. Charles.
//
// 2000 and 2001 (Chad Fredericks) added from the original schedule
// pages Andy found: 9-3 and 3-12, both matching Season History, all regular season (pre-2002
// results all count as regular season). One unscored 5/16/2001 Toledo
// Wolfpack game is excluded. The 4/28/2001 neutral-site St. Charles
// game was St. Charles, Illinois.
//
// Seasons with no game-by-game source at all (1990-1999: Brad Lay,
// Mike Degens, Chad Fredericks 1998-1999, Jim Reed 1995-1997) have no
// rows. COACHING_MATRIX_COVERAGE below records exactly which seasons
// each coach's rows cover, so the page can say so when it's partial.
//
// One correction to the spreadsheet (2026-09-23): the McComish sheet
// totaled 76-75 against the program's 76-76. Reconciled game by game
// against Game_History.xlsx (2007-2014 tabs plus Playoff Game Details):
// every opponent matched except two. Sylvania Maple Leafs (2007-2009)
// is 2-3, not 3-2. Sylvania Northview (2010-2014) is 6-0, not 5-0,
// with one playoff win (5/19/2011), so 5-0 regular, not 4-0. After the
// fix McComish is 71-68 regular, 5-8 playoffs, 76-76, matching Season
// History.
//
// Row shape: [head coach, opponent, regular W, regular L, playoff W, playoff L]
export const COACHING_MATRIX_BASELINE = [
  ["Andrew Smith", "Anthony Wayne", 4, 0, 0, 0],
  ["Andrew Smith", "Archbishop Hoban", 1, 0, 0, 0],
  ["Andrew Smith", "Bay", 3, 0, 0, 0],
  ["Andrew Smith", "Benedictine", 0, 0, 3, 0],
  ["Andrew Smith", "Bishop Watterson", 0, 2, 0, 0],
  ["Andrew Smith", "Bowling Green", 2, 0, 0, 0],
  ["Andrew Smith", "Brebeuf Jesuit", 1, 0, 0, 0],
  ["Andrew Smith", "Brother Rice", 0, 3, 0, 0],
  ["Andrew Smith", "Chagrin Falls", 1, 0, 0, 1],
  ["Andrew Smith", "Chaminade Julienne", 1, 1, 0, 0],
  ["Andrew Smith", "Columbus Academy", 1, 0, 0, 0],
  ["Andrew Smith", "Copley", 0, 1, 0, 0],
  ["Andrew Smith", "Cranbrook", 3, 1, 0, 0],
  ["Andrew Smith", "CVCA", 1, 0, 0, 0],
  ["Andrew Smith", "De La Salle", 3, 0, 0, 0],
  ["Andrew Smith", "Detroit Catholic Central", 0, 3, 0, 0],
  ["Andrew Smith", "Detroit Country Day", 0, 2, 0, 0],
  ["Andrew Smith", "Eugene Ashley (NC)", 0, 1, 0, 0],
  ["Andrew Smith", "Findlay", 1, 0, 0, 0],
  ["Andrew Smith", "Gilmour Academy", 1, 0, 0, 0],
  ["Andrew Smith", "Holy Name", 0, 0, 1, 0],
  ["Andrew Smith", "Indian Hill", 0, 1, 0, 0],
  ["Andrew Smith", "Lincoln Gahanna", 1, 0, 0, 0],
  ["Andrew Smith", "Northview", 4, 0, 0, 0],
  ["Andrew Smith", "Oakwood", 2, 0, 0, 0],
  ["Andrew Smith", "Olmsted Falls", 2, 1, 0, 1],
  ["Andrew Smith", "Orchard Lake St. Mary's", 2, 2, 0, 0],
  ["Andrew Smith", "Ottawa Hills", 4, 2, 4, 0],
  ["Andrew Smith", "Padua Franciscan", 0, 0, 1, 0],
  ["Andrew Smith", "Perrysburg", 4, 1, 0, 0],
  ["Andrew Smith", "Revere", 1, 0, 0, 0],
  ["Andrew Smith", "Rocky River", 0, 1, 2, 1],
  ["Andrew Smith", "Shaker Heights", 0, 1, 0, 0],
  ["Andrew Smith", "Southview", 5, 0, 1, 0],
  ["Andrew Smith", "St. Edward's", 1, 1, 0, 0],
  ["Andrew Smith", "St. Francis Columbus", 0, 0, 0, 1],
  ["Andrew Smith", "St. Francis Toledo", 3, 3, 2, 2],
  ["Andrew Smith", "St. Ignatius Blue", 1, 1, 0, 0],
  ["Andrew Smith", "St. Joseph's", 1, 1, 0, 0],
  ["Andrew Smith", "Topsail (NC)", 1, 0, 0, 0],
  ["Andrew Smith", "UD Jesuit", 5, 0, 0, 0],
  ["Andrew Smith", "University School", 0, 0, 1, 0],
  ["Andrew Smith", "Walsh Jesuit", 2, 2, 1, 0],
  ["Andrew Smith", "Westlake", 4, 0, 0, 0],
  ["Andrew Smith", "Wooster", 0, 0, 1, 0],
  ["Adam Salon", "Ann Arbor Pioneer", 0, 2, 0, 0],
  ["Adam Salon", "Anthony Wayne", 2, 3, 0, 0],
  ["Adam Salon", "Archbishop Hoban", 0, 1, 0, 0],
  ["Adam Salon", "Avon", 1, 0, 0, 0],
  ["Adam Salon", "Avon Lake", 0, 0, 1, 0],
  ["Adam Salon", "Bay", 1, 0, 0, 0],
  ["Adam Salon", "Bowling Green", 2, 0, 0, 0],
  ["Adam Salon", "Brebeuf Jesuit", 2, 0, 0, 0],
  ["Adam Salon", "Brecksville Broadview", 1, 0, 0, 0],
  ["Adam Salon", "Brunswick", 3, 0, 1, 0],
  ["Adam Salon", "Chagrin Falls", 0, 1, 0, 0],
  ["Adam Salon", "Delaware Hayes", 0, 2, 0, 1],
  ["Adam Salon", "Erie McDowell", 1, 0, 0, 0],
  ["Adam Salon", "Fishers", 0, 1, 0, 0],
  ["Adam Salon", "Hilliard Darby", 0, 1, 0, 0],
  ["Adam Salon", "Kenston", 0, 1, 0, 0],
  ["Adam Salon", "Lincoln, Gahanna", 1, 0, 0, 0],
  ["Adam Salon", "Marquette", 1, 1, 0, 0],
  ["Adam Salon", "Massilon Jackson", 1, 2, 0, 0],
  ["Adam Salon", "Medina", 1, 1, 0, 0],
  ["Adam Salon", "Mentor", 0, 2, 0, 0],
  ["Adam Salon", "Olentangy", 0, 0, 0, 1],
  ["Adam Salon", "Ottawa Hills", 2, 2, 0, 1],
  ["Adam Salon", "Perrysburg", 4, 2, 1, 0],
  ["Adam Salon", "Rocky River", 0, 1, 0, 0],
  ["Adam Salon", "Saline", 0, 2, 0, 0],
  ["Adam Salon", "Shaker Heights", 1, 0, 0, 0],
  ["Adam Salon", "St. Charles", 0, 1, 0, 0],
  ["Adam Salon", "St. Edward", 0, 2, 0, 0],
  ["Adam Salon", "St. Francis Toledo", 0, 5, 0, 1],
  ["Adam Salon", "St. Ignatius (Prep)", 0, 1, 0, 1],
  ["Adam Salon", "Stow Monroe Falls", 1, 0, 0, 0],
  ["Adam Salon", "Strongsville", 3, 1, 0, 0],
  ["Adam Salon", "Summit Country Day", 1, 0, 0, 0],
  ["Adam Salon", "Sylvania Northview", 5, 0, 0, 0],
  ["Adam Salon", "Sylvania Southview", 5, 0, 1, 0],
  ["Adam Salon", "Toledo Central Catholic", 2, 0, 0, 0],
  ["Adam Salon", "University of Detroit Jesuit", 0, 1, 0, 0],
  ["Adam Salon", "Wadsworth", 3, 0, 0, 0],
  ["Adam Salon", "Westlake", 2, 0, 1, 0],
  ["Adam Salon", "Wooster", 1, 1, 0, 0],
  ["Mike McComish", "Ann Arbor Pioneer", 0, 3, 0, 0],
  ["Mike McComish", "Ann Arbor Skyline", 1, 1, 0, 0],
  ["Mike McComish", "Anthony Wayne", 4, 0, 0, 0],
  ["Mike McComish", "Bedford", 1, 0, 0, 0],
  ["Mike McComish", "Bishop Watterson", 1, 1, 0, 0],
  ["Mike McComish", "Brebeuf Jesuit", 2, 0, 0, 0],
  ["Mike McComish", "Brother Rice (Orange)", 0, 1, 0, 0],
  ["Mike McComish", "Brunswick", 0, 0, 1, 0],
  ["Mike McComish", "Cathedral Prep", 1, 0, 0, 0],
  ["Mike McComish", "Cincinnati St. Xavier", 1, 0, 0, 0],
  ["Mike McComish", "Clarkston", 1, 0, 0, 0],
  ["Mike McComish", "DeSmet Jesuit", 1, 0, 0, 0],
  ["Mike McComish", "Detroit Catholic Central", 2, 1, 0, 0],
  ["Mike McComish", "Dublin Coffman", 2, 1, 0, 1],
  ["Mike McComish", "Dublin Jerome", 0, 0, 0, 1],
  ["Mike McComish", "Erie McDowell", 2, 1, 0, 0],
  ["Mike McComish", "Hilliard Darby", 3, 0, 0, 0],
  ["Mike McComish", "Hilliard Davidson", 1, 0, 0, 0],
  ["Mike McComish", "Hoover", 1, 3, 0, 0],
  ["Mike McComish", "Hudson", 0, 2, 0, 0],
  ["Mike McComish", "Kent Roosevelt", 2, 2, 0, 0],
  ["Mike McComish", "Lakota West", 2, 0, 0, 0],
  ["Mike McComish", "Lexington Catholic", 1, 0, 0, 0],
  ["Mike McComish", "Lexington Dunbar", 1, 0, 0, 0],
  ["Mike McComish", "Lexington Tates Creek", 1, 0, 0, 0],
  ["Mike McComish", "Liberty Olentangy", 0, 1, 0, 0],
  ["Mike McComish", "Marquette", 2, 0, 0, 0],
  ["Mike McComish", "Massilon Jackson", 0, 1, 0, 0],
  ["Mike McComish", "Medina", 2, 6, 0, 0],
  ["Mike McComish", "Notre Dame Prep", 1, 2, 0, 0],
  ["Mike McComish", "Olentangy", 1, 6, 0, 0],
  ["Mike McComish", "Perrysburg", 8, 0, 1, 0],
  ["Mike McComish", "Seneca Valley", 0, 1, 0, 0],
  ["Mike McComish", "Shaker Heights", 1, 0, 0, 0],
  ["Mike McComish", "Solon", 0, 1, 0, 0],
  ["Mike McComish", "St. Charles", 1, 3, 0, 0],
  ["Mike McComish", "St. Edward", 0, 0, 0, 1],
  ["Mike McComish", "St. Francis Toledo", 6, 5, 0, 0],
  ["Mike McComish", "St. Ignatius (Prep)", 1, 6, 0, 0],
  ["Mike McComish", "Strongsville", 0, 1, 0, 1],
  ["Mike McComish", "Summit Country Day", 0, 1, 0, 0],
  ["Mike McComish", "Sylvania Maple Leafs", 2, 3, 0, 0], // corrected from 3-2, see header
  ["Mike McComish", "Sylvania Northview", 5, 0, 1, 0], // corrected from 4-0 regular, see header
  ["Mike McComish", "Sylvania Southview", 0, 6, 0, 2],
  ["Mike McComish", "Thomas Worthington", 0, 2, 0, 2],
  ["Mike McComish", "Toledo Central Catholic", 5, 0, 0, 0],
  ["Mike McComish", "Troy Athens", 0, 2, 0, 0],
  ["Mike McComish", "University School", 0, 1, 0, 0],
  ["Mike McComish", "Upper Arlington", 0, 3, 0, 0],
  ["Mike McComish", "Walsh Jesuit", 2, 0, 0, 0],
  ["Mike McComish", "Westerville North", 2, 0, 1, 0],
  ["Mike McComish", "Westlake", 0, 0, 1, 0],
  ["Mike McComish", "Wheeling Cent Cath", 1, 0, 0, 0],
  ["Mike McComish", "Wooster", 0, 1, 0, 0],
  // 2002-2006, from Game_History.xlsx
  ["Jim Reed", "Ann Arbor Pioneer", 0, 1, 0, 0],
  ["Jim Reed", "Chagrin Falls", 2, 0, 0, 0],
  ["Jim Reed", "Cincinnati Sycamore", 0, 0, 0, 1],
  ["Jim Reed", "Cleveland Heights", 3, 0, 0, 0],
  ["Jim Reed", "Culver Military Academy", 1, 0, 0, 0],
  ["Jim Reed", "Dublin Coffman", 0, 1, 0, 0],
  ["Jim Reed", "Dublin Jerome", 0, 1, 0, 0],
  ["Jim Reed", "Hawken School", 1, 2, 0, 0],
  ["Jim Reed", "Hilliard Darby", 2, 1, 0, 0],
  ["Jim Reed", "Hilliard Davidson", 1, 0, 0, 0],
  ["Jim Reed", "Hudson", 0, 1, 0, 1],
  ["Jim Reed", "Kent Roosevelt", 1, 3, 2, 0],
  ["Jim Reed", "Massillon Jackson", 2, 0, 1, 0],
  ["Jim Reed", "Medina", 0, 3, 0, 0],
  ["Jim Reed", "Mentor", 1, 0, 0, 0],
  ["Jim Reed", "Olentangy", 3, 1, 0, 0],
  ["Jim Reed", "Perrysburg", 2, 0, 1, 0],
  ["Jim Reed", "Shaker Heights", 2, 2, 1, 1],
  ["Jim Reed", "St. Charles", 2, 1, 0, 0],
  ["Jim Reed", "St. Charles (IL)", 1, 0, 0, 0],
  ["Jim Reed", "St. Francis Toledo", 2, 0, 0, 0],
  ["Jim Reed", "St. Ignatius (Prep)", 0, 2, 0, 0],
  ["Jim Reed", "Sylvania Maple Leafs", 3, 1, 0, 0],
  ["Jim Reed", "Toledo Wolfpack", 3, 0, 0, 0],
  ["Jim Reed", "University School", 2, 1, 1, 0],
  ["Jim Reed", "Walsh Jesuit", 3, 1, 0, 1],
  ["Jim Reed", "Wellington School", 1, 2, 0, 0],
  ["Jim Reed", "Westerville South", 1, 0, 0, 0],
  // Chad Fredericks 2000-2001 (from the original schedule pages Andy
  // found) and 2002, combined
  ["Chad Fredericks", "Cleveland Heights", 2, 1, 0, 0],
  ["Chad Fredericks", "Culver Military Academy", 1, 1, 0, 0],
  ["Chad Fredericks", "Hilliard Darby", 0, 2, 0, 0],
  ["Chad Fredericks", "Indian Hill", 0, 2, 0, 0],
  ["Chad Fredericks", "Medina", 0, 3, 0, 0],
  ["Chad Fredericks", "Revere", 2, 0, 0, 0],
  ["Chad Fredericks", "Shaker Heights", 1, 2, 0, 1],
  ["Chad Fredericks", "St. Charles", 0, 2, 0, 0],
  ["Chad Fredericks", "St. Charles (IL)", 0, 1, 0, 0],
  ["Chad Fredericks", "Sylvania Maple Leafs", 3, 0, 0, 0],
  ["Chad Fredericks", "Toledo Wolfpack", 5, 0, 0, 0],
  ["Chad Fredericks", "University School", 1, 3, 0, 0],
  ["Chad Fredericks", "Walsh Jesuit", 1, 2, 0, 0],
  ["Chad Fredericks", "Wellington School", 1, 2, 0, 0],
  ["Chad Fredericks", "Western Reserve Academy", 0, 3, 0, 0],
];

// Seasons each coach's baseline rows cover. Compared on the coach page
// against that coach's hand-kept head-coach seasons: when some aren't
// covered, the page notes the span and labels the Total row with it.
// 2020 is included for Smith because the cancelled season has no games
// to cover.
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
export const COACHING_MATRIX_COVERAGE = {
  'Chad Fredericks': [2000, 2001, 2002],
  'Jim Reed': range(2003, 2006),
  'Mike McComish': range(2007, 2014),
  'Adam Salon': range(2015, 2019),
  'Andrew Smith': range(2020, 2026),
};
