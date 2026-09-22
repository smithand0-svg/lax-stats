import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Small dataset, same load-in-full-and-filter-client-side pattern as
// /api/admin/opponents -- used by PlayerPicker for the awards admin
// form (TM-18), and reusable anywhere else an admin player picker is
// needed later.
export async function GET() {
  try {
    const { rows: players } = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.graduation_year
       FROM players p
       JOIN teams t ON t.id = p.team_id
       WHERE t.slug = 'sjj'
       ORDER BY p.last_name, p.first_name`
    );
    return jsonNoStore({ players });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: err.message }, { status: 500 });
  }
}
