import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';
import { getDefaultTeamId, resolvePlayerId } from '@/lib/adminAwards';

export const dynamic = 'force-dynamic';

const DIVISIONS = ['D1', 'D2', 'D3'];

export async function GET() {
  try {
    const teamId = await getDefaultTeamId();
    const { rows } = await pool.query(
      `SELECT id, player_id, player_name, honor_year, position, school, division
       FROM player_honors
       WHERE team_id = $1 AND honor_type = 'college_commitment'
       ORDER BY honor_year DESC NULLS LAST, player_name`,
      [teamId]
    );
    return jsonNoStore({ commitments: rows });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const teamId = await getDefaultTeamId();
    const body = await request.json();
    const playerName = (body.playerName || '').trim();
    const graduationYear = body.graduationYear ? parseInt(body.graduationYear, 10) : null;
    const honorYear = body.honorYear ? parseInt(body.honorYear, 10) : null;
    const position = (body.position || '').trim() || null;
    const school = (body.school || '').trim();
    const division = body.division;

    if (!playerName) {
      return jsonNoStore({ error: 'A player name is required.' }, { status: 400 });
    }
    if (!school) {
      return jsonNoStore({ error: 'A school is required.' }, { status: 400 });
    }
    if (!DIVISIONS.includes(division)) {
      return jsonNoStore({ error: `Division must be one of: ${DIVISIONS.join(', ')}.` }, { status: 400 });
    }

    // Same disambiguation convention as everywhere else -- grad year
    // (the player's own class), not the commitment year, is what
    // actually identifies the person when a name collides.
    const playerId = await resolvePlayerId(playerName, graduationYear);

    const { rows } = await pool.query(
      `INSERT INTO player_honors (team_id, player_id, player_name, honor_type, honor_year, position, school, division)
       VALUES ($1, $2, $3, 'college_commitment', $4, $5, $6, $7)
       RETURNING id, player_id, player_name, honor_year, position, school, division`,
      [teamId, playerId, playerName, honorYear, position, school, division]
    );

    return jsonNoStore({ commitment: rows[0] });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
