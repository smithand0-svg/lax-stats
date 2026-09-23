import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';
import { getDefaultTeamId } from '@/lib/adminAwards';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const teamId = await getDefaultTeamId();
    const { id, seasonId } = await params;
    const { rows } = await pool.query(
      `DELETE FROM staff_seasons ss
       USING staff s
       WHERE ss.staff_id = s.id AND s.team_id = $1 AND ss.staff_id = $2 AND ss.id = $3
       RETURNING ss.id`,
      [teamId, id, seasonId]
    );
    if (!rows[0]) return jsonNoStore({ error: 'Season assignment not found.' }, { status: 404 });
    return jsonNoStore({ deleted: true });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
