import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// TM-17: toggles program_seasons.finalized_at for one team_id+season_year.
// Finalizing/unfinalizing itself does not touch anything else in the app
// (coach tenure, current-season pointers, etc.) -- that's the separate
// season-advance mechanism (TM-24). This route is purely the lock/unlock.
export async function POST(request, { params }) {
  try {
    const { year } = await params;
    const seasonYear = parseInt(year, 10);
    if (!Number.isFinite(seasonYear)) {
      return NextResponse.json({ error: 'Invalid season year.' }, { status: 400 });
    }

    const body = await request.json();
    const finalize = !!body.finalize;

    // TM-36 point 2: finalizing can also save the end-of-season Season
    // History details in the same step. Only on finalize, and only when
    // a details object is sent -- unfinalizing never touches them. Every
    // field is free text (open vocabulary, per the site convention);
    // blank means NULL, so a field can be cleared deliberately.
    const DETAIL_FIELDS = ['playoff_result', 'special_note', 'brothers_cup', 'league_finish'];
    const details = finalize && body.details && typeof body.details === 'object' ? body.details : null;
    const clean = (v) => {
      if (v === undefined || v === null) return null;
      const t = String(v).trim();
      return t === '' ? null : t.slice(0, 200);
    };

    const { rows } = details
      ? await pool.query(
          `UPDATE program_seasons
           SET finalized_at = $1, playoff_result = $3, special_note = $4, brothers_cup = $5, league_finish = $6
           WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = $2
           RETURNING season_year, finalized_at`,
          [new Date(), seasonYear, ...DETAIL_FIELDS.map((f) => clean(details[f]))]
        )
      : await pool.query(
          `UPDATE program_seasons
           SET finalized_at = $1
           WHERE team_id = (SELECT id FROM teams WHERE slug = 'sjj') AND season_year = $2
           RETURNING season_year, finalized_at`,
          [finalize ? new Date() : null, seasonYear]
        );

    if (!rows[0]) {
      return NextResponse.json({ error: `No season record found for ${seasonYear}.` }, { status: 404 });
    }

    return NextResponse.json({ seasonYear: rows[0].season_year, finalizedAt: rows[0].finalized_at });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
