import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// For MVP there's exactly one team (SJJ) — same pattern as
// import/preview/route.js.
async function getDefaultTeamId() {
  const { rows } = await pool.query("SELECT id FROM teams WHERE slug = 'sjj'");
  if (!rows[0]) throw new Error('Default team not found — did you run the schema migration?');
  return rows[0].id;
}

// Small dataset (106 opponents + 98 aliases as of the initial seed) —
// loaded in full for the admin-import picker to filter client-side as the
// admin types, rather than round-tripping a query per keystroke.
export async function GET() {
  try {
    const teamId = await getDefaultTeamId();
    const { rows: opponents } = await pool.query(
      'SELECT id, name FROM opponents WHERE team_id = $1 ORDER BY name',
      [teamId]
    );
    const { rows: aliases } = await pool.query(
      `SELECT oa.opponent_id AS "opponentId", oa.alias_name AS "aliasName"
       FROM opponent_aliases oa
       JOIN opponents o ON o.id = oa.opponent_id
       WHERE o.team_id = $1`,
      [teamId]
    );
    return NextResponse.json({ teamId, opponents, aliases });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
