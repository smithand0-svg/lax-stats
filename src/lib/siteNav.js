// TM-29: the public site's four navigation groups, used by both the
// header menu (SiteHeader) and the homepage. Names and grouping are
// Andy's starting point, cheap to reorganize: this is the single place
// to change them. Kept out of the 'use client' header file so server
// components can import the data directly.
export const SITE_GROUPS = [
  {
    label: 'Records',
    links: [
      { href: '/leaderboard', text: 'Player Records', blurb: 'All-time individual leaders by game, season, and career.' },
      { href: '/team-stats', text: 'Team Records', blurb: 'Best team games and seasons, regular season and playoffs.' },
    ],
  },
  {
    label: 'Seasons',
    links: [
      { href: '/season-history', text: 'Year by Year', blurb: 'Every season since 1990: records, coaches, and playoff runs.' },
    ],
  },
  {
    label: 'People',
    links: [
      { href: '/search', text: 'Find a Player', blurb: 'Look up any player’s stats, honors, and records.' },
      { href: '/coaching-stats', text: 'Coaches', blurb: 'Every head coach, their records, and head-to-head results.' },
    ],
  },
  {
    label: 'Honors',
    links: [
      { href: '/season-awards', text: 'Season Awards', blurb: 'Team awards and all-league, all-state, and All-American honors.' },
      { href: '/college-honors', text: 'College & All-Americans', blurb: 'SJJ players who went on to play in college.' },
    ],
  },
];
