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

    const { rows } = await pool.query(
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
