import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';
import { getDefaultTeamId } from '@/lib/adminAwards';

export const dynamic = 'force-dynamic';

// Returns every staff member with their season assignments nested --
// small dataset (coaching staff, not players), fine to load in full.
export async function GET() {
  try {
    const teamId = await getDefaultTeamId();
    const { rows: staff } = await pool.query(
      `SELECT id, first_name, last_name, bio FROM staff WHERE team_id = $1 ORDER BY last_name, first_name`,
      [teamId]
    );
    const { rows: seasons } = await pool.query(
      `SELECT ss.id, ss.staff_id, ss.season_year, ss.team_level, ss.role
       FROM staff_seasons ss
       JOIN staff s ON s.id = ss.staff_id
       WHERE s.team_id = $1
       ORDER BY ss.season_year DESC`,
      [teamId]
    );
    const byStaff = {};
    for (const s of seasons) {
      if (!byStaff[s.staff_id]) byStaff[s.staff_id] = [];
      byStaff[s.staff_id].push(s);
    }
    return jsonNoStore({ staff: staff.map((s) => ({ ...s, seasons: byStaff[s.id] || [] })) });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const teamId = await getDefaultTeamId();
    const body = await request.json();
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const bio = (body.bio || '').trim() || null;

    if (!firstName || !lastName) {
      return jsonNoStore({ error: 'First and last name are required.' }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO staff (team_id, first_name, last_name, bio)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, first_name, last_name) DO UPDATE SET bio = COALESCE(staff.bio, EXCLUDED.bio)
       RETURNING id, first_name, last_name, bio`,
      [teamId, firstName, lastName, bio]
    );

    return jsonNoStore({ staff: { ...rows[0], seasons: [] } });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
