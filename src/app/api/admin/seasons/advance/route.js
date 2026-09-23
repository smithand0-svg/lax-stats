import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// TM-24: the season-advance mechanism. This is the trigger itself --
// clicking Advance (with the Yes/No coach-continuing prompt already
// answered client-side) is what credits the outgoing coach another
// season and puts a name in the new row. No date gating: Andy
// considered and rejected a Jan/Feb 1 calendar-based design as
// unnecessary complexity for something that's only happened 7 times
// in program history. A coach change shortly after an otherwise-normal
// advance is an acceptable rare edge case, fixed manually afterward via
// TM-34 (change head coach), not built around here.
//
// Three things happen atomically:
//   1. A new program_seasons row for teams.current_season_year + 1,
//      with head_coach populated immediately (copied forward if
//      continuing, or the new name if not) -- every other column is
//      left at its table default, same shape as Andy would start a
//      fresh season row by hand.
//   2. teams.current_season_year is incremented. This is the single
//      source of truth TM-16's amber "in progress" highlighting reads
//      on Team Stats and the Leaderboard, replacing the old inferred
//      MAX(season_year)-with-live-data heuristic -- so old-season
//      highlighting turns off the moment this fires, regardless of
//      whether the new season has any game data yet.
//   3. (No separate step for Coaching Stats -- its tenure count and
//      "2020-Present"-style range formatting are already computed
//      dynamically off program_seasons.head_coach, so a correctly
//      populated new row is all it needs.)
export async function POST(request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const continuing = !!body.continuing;
    const newHeadCoach = typeof body.newHeadCoach === 'string' ? body.newHeadCoach.trim() : '';

    // TM-36 point 1: division is known before the season starts, so it's
    // asked for here alongside the coach question. Optional -- blank
    // leaves it NULL, same as any other not-yet-known field.
    const rawDivision = body.division;
    let division = null;
    if (rawDivision !== undefined && rawDivision !== null && String(rawDivision).trim() !== '') {
      division = parseInt(String(rawDivision).trim(), 10);
      if (!Number.isInteger(division) || division < 1 || String(division) !== String(rawDivision).trim()) {
        return NextResponse.json({ error: 'Division must be a whole number (e.g. 1 or 2), or left blank.' }, { status: 400 });
      }
    }

    if (!continuing && !newHeadCoach) {
      return NextResponse.json({ error: 'A new head coach name is required.' }, { status: 400 });
    }

    await client.query('BEGIN');

    const { rows: teamRows } = await client.query(
      `SELECT id, current_season_year FROM teams WHERE slug = 'sjj' FOR UPDATE`
    );
    const team = teamRows[0];
    if (!team) {
      throw new Error('Team "sjj" not found.');
    }
    if (team.current_season_year === null) {
      throw new Error('teams.current_season_year is not set -- cannot advance from an unknown season.');
    }

    const currentYear = team.current_season_year;
    const nextYear = currentYear + 1;

    const { rows: currentSeasonRows } = await client.query(
      `SELECT head_coach, league_name FROM program_seasons WHERE team_id = $1 AND season_year = $2`,
      [team.id, currentYear]
    );
    const currentHeadCoach = currentSeasonRows[0]?.head_coach || null;
    // League affiliation carries forward (e.g. CHSL since 2024) -- the
    // league RECORD and finish start empty, since the new season hasn't
    // been played.
    const currentLeagueName = currentSeasonRows[0]?.league_name || null;

    if (continuing && !currentHeadCoach) {
      throw new Error(`No head coach on record for ${currentYear} to carry forward -- use "No" and enter the new coach's name instead.`);
    }

    const headCoachForNextYear = continuing ? currentHeadCoach : newHeadCoach;

    const { rows: existing } = await client.query(
      `SELECT id FROM program_seasons WHERE team_id = $1 AND season_year = $2`,
      [team.id, nextYear]
    );
    if (existing[0]) {
      throw new Error(`A program_seasons row for ${nextYear} already exists -- advance has already run, or the row was created some other way. Use TM-34 to change its head coach instead.`);
    }

    await client.query(
      // auto_record = true: from here on, this season's W/L is
      // calculated from imported game results (TM-36), not hand-entered.
      // League W/L starts at 0-0 when the season has a league.
      `INSERT INTO program_seasons (team_id, season_year, head_coach, division, league_name, auto_record, league_wins, league_losses)
       VALUES ($1, $2, $3, $4, $5, true, $6, $6)`,
      [team.id, nextYear, headCoachForNextYear, division, currentLeagueName, currentLeagueName ? 0 : null]
    );

    await client.query(
      `UPDATE teams SET current_season_year = $1 WHERE id = $2`,
      [nextYear, team.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      previousYear: currentYear,
      newYear: nextYear,
      headCoach: headCoachForNextYear,
      division,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  } finally {
    client.release();
  }
}
