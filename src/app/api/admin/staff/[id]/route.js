import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';
import { getDefaultTeamId } from '@/lib/adminAwards';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const teamId = await getDefaultTeamId();
    const { id } = await params;
    const body = await request.json();
    const bio = (body.bio || '').trim() || null;

    const { rows } = await pool.query(
      `UPDATE staff SET bio = $1 WHERE id = $2 AND team_id = $3 RETURNING id, first_name, last_name, bio`,
      [bio, id, teamId]
    );
    if (!rows[0]) return jsonNoStore({ error: 'Staff member not found.' }, { status: 404 });
    return jsonNoStore({ staff: rows[0] });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const teamId = await getDefaultTeamId();
    const { id } = await params;
    // staff_seasons and season_honors both reference staff(id) with no
    // ON DELETE clause -- Postgres will refuse this delete (a foreign
    // key violation, not a silent orphan) if the person has any
    // seasons or honors on record, which is the right default: remove
    // those first, or don't remove someone with real history attached.
    const { rows } = await pool.query(
      `DELETE FROM staff WHERE id = $1 AND team_id = $2 RETURNING id`,
      [id, teamId]
    );
    if (!rows[0]) return jsonNoStore({ error: 'Staff member not found.' }, { status: 404 });
    return jsonNoStore({ deleted: true });
  } catch (err) {
    console.error(err);
    if (err.code === '23503') {
      return jsonNoStore(
        { error: 'This person has season assignments or honors on record -- remove those first.' },
        { status: 409 }
      );
    }
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
