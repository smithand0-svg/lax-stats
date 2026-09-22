import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getDefaultTeamId } from '@/lib/adminAwards';

export async function DELETE(request, { params }) {
  try {
    const teamId = await getDefaultTeamId();
    const { id } = await params;
    const { rows } = await pool.query(
      `DELETE FROM season_honors WHERE id = $1 AND team_id = $2 RETURNING id`,
      [id, teamId]
    );
    if (!rows[0]) {
      return NextResponse.json({ error: 'Honor not found.' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
