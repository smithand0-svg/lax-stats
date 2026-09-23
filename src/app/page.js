import Link from 'next/link';
import { pool } from '@/lib/db';
import { BASE_PATH } from '@/lib/basePath';
import { SITE_GROUPS } from '@/lib/siteNav';

export const dynamic = 'force-dynamic';

// TM-29: public homepage. The program line under the title is calculated
// live from Season History (program_seasons), so it stays current as
// seasons are added, with no hand editing.
async function getProgramFacts() {
  const { rows } = await pool.query(
    `SELECT MIN(season_year) FILTER (WHERE total_wins + total_losses > 0) AS first_year,
            COUNT(*) FILTER (WHERE total_wins + total_losses > 0) AS seasons,
            COALESCE(SUM(total_wins), 0) AS wins,
            COALESCE(SUM(total_losses), 0) AS losses,
            ARRAY_REMOVE(ARRAY_AGG(season_year ORDER BY season_year)
              FILTER (WHERE playoff_result = 'State Finals'), NULL) AS state_finals
     FROM program_seasons
     WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj')`
  );
  return rows[0];
}

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function programLine(f) {
  if (!f || !Number(f.seasons)) return null;
  const parts = [`${f.seasons} seasons since ${f.first_year}`, `${f.wins} wins`];
  const finals = f.state_finals || [];
  let sentence = `${parts.join(', ')}.`;
  if (finals.length === 1) sentence += ` State Finals in ${finals[0]}.`;
  if (finals.length > 1) {
    const n = COUNT_WORDS[finals.length] || String(finals.length);
    const years = finals.length === 2 ? finals.join(' and ') : `${finals.slice(0, -1).join(', ')}, and ${finals.at(-1)}`;
    sentence += ` ${n[0].toUpperCase()}${n.slice(1)} trips to the State Finals, in ${years}.`;
  }
  return sentence;
}

export default async function Home() {
  let facts = null;
  try {
    facts = await getProgramFacts();
  } catch {
    // The homepage should still render its menu if the database is down.
  }
  const line = programLine(facts);

  return (
    <main className="flex-1">
      <section className="relative bg-sjj-blue text-white">
        <picture>
          <source media="(max-width: 767px)" srcSet={`${BASE_PATH}/hero-helmets-1000.jpg`} />
          <img
            src={`${BASE_PATH}/hero-helmets.jpg`}
            alt="A row of SJJ gold helmets on the turf"
            width={2000}
            height={853}
            className="w-full h-56 md:h-[28rem] object-cover object-left"
          />
        </picture>
        {/* Blue fades in from the right, over the open turf, so the front
            helmets stay clear. On phones the text sits below the photo. */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-l from-sjj-blue via-sjj-blue/85 to-transparent to-65%" />
        <div className="md:absolute md:inset-0">
          <div className="max-w-6xl mx-auto h-full px-6 py-8 md:py-0 flex items-center md:justify-end">
            <div className="md:max-w-md">
              <h1 className="font-varsity text-4xl md:text-5xl leading-tight">St. John&apos;s Jesuit Lacrosse</h1>
              <div className="h-1 w-16 bg-sjj-gold my-4" aria-hidden="true" />
              <p className="text-lg text-white/90 leading-relaxed">
                The record book of Titans lacrosse: every season, every record, every honor.
              </p>
              {line && <p className="mt-3 text-white/75 leading-relaxed">{line}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {SITE_GROUPS.map((g) => (
          <div key={g.label} className="border-t-4 border-sjj-gold pt-4">
            <h2 className="text-xl font-bold text-sjj-blue dark:text-white mb-4">{g.label}</h2>
            <ul className="space-y-4">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-semibold text-sjj-blue dark:text-white underline decoration-sjj-gold decoration-2 underline-offset-4 hover:decoration-4"
                  >
                    {l.text}
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{l.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
