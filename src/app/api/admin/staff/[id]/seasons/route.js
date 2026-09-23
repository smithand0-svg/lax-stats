import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';
import { getDefaultTeamId } from '@/lib/adminAwards';

export const dynamic = 'force-dynamic';

const TEAM_LEVELS = ['Varsity', 'JV Gold', 'JV Blue'];

export async function POST(request, { params }) {
  try {
    const teamId = await getDefaultTeamId();
    const { id } = await params;
    const body = await request.json();
    const seasonYear = parseInt(body.seasonYear, 10);
    const teamLevel = body.teamLevel;
    const role = (body.role || '').trim();

    if (!Number.isFinite(seasonYear)) {
      return jsonNoStore({ error: 'A season year is required.' }, { status: 400 });
    }
    if (!TEAM_LEVELS.includes(teamLevel)) {
      return jsonNoStore({ error: `Team level must be one of: ${TEAM_LEVELS.join(', ')}.` }, { status: 400 });
    }
    if (!role) {
      return jsonNoStore({ error: 'A role is required.' }, { status: 400 });
    }

    // Confirm the staff member belongs to this team before attaching a
    // season to them.
    const { rows: staffRows } = await pool.query(
      `SELECT id FROM staff WHERE id = $1 AND team_id = $2`,
      [id, teamId]
    );
    if (!staffRows[0]) return jsonNoStore({ error: 'Staff member not found.' }, { status: 404 });

    const { rows } = await pool.query(
      `INSERT INTO staff_seasons (staff_id, season_year, team_level, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (staff_id, season_year, team_level, role) DO NOTHING
       RETURNING id, staff_id, season_year, team_level, role`,
      [id, seasonYear, teamLevel, role]
    );
    if (!rows[0]) {
      return jsonNoStore({ error: 'That exact season/level/role is already on record for this person.' }, { status: 409 });
    }
    return jsonNoStore({ season: rows[0] });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
