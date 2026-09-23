import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';
import { getDefaultTeamId, resolvePlayerId, resolveStaffId } from '@/lib/adminAwards';

export const dynamic = 'force-dynamic';

// GET ?season=YYYY -- list this season's external honors (both player
// and staff recipients), newest-added first.
export async function GET(request) {
  try {
    const teamId = await getDefaultTeamId();
    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season'), 10);
    if (!Number.isFinite(season)) {
      return jsonNoStore({ error: 'A season year is required.' }, { status: 400 });
    }
    const { rows } = await pool.query(
      `SELECT id, season_year, grad_year, position, honor_source, honor_label, player_id, staff_id, player_name, note, recipient_type
       FROM season_honors
       WHERE team_id = $1 AND season_year = $2
       ORDER BY id DESC`,
      [teamId, season]
    );
    return jsonNoStore({ honors: rows });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const teamId = await getDefaultTeamId();
    const body = await request.json();
    const recipientType = body.recipientType === 'staff' ? 'staff' : 'player';
    const seasonYear = parseInt(body.seasonYear, 10);
    const gradYear = body.gradYear ? parseInt(body.gradYear, 10) : null;
    const position = (body.position || '').trim() || null;
    const honorSource = (body.honorSource || '').trim();
    const honorLabel = (body.honorLabel || '').trim();
    const recipientName = (body.playerName || '').trim();
    const note = (body.note || '').trim() || null;

    if (!Number.isFinite(seasonYear)) {
      return jsonNoStore({ error: 'A season year is required.' }, { status: 400 });
    }
    if (!honorSource) {
      return jsonNoStore({ error: 'An honor source is required.' }, { status: 400 });
    }
    if (!honorLabel) {
      return jsonNoStore({ error: 'An honor label is required.' }, { status: 400 });
    }
    if (!recipientName) {
      return jsonNoStore({ error: 'A recipient name is required.' }, { status: 400 });
    }

    // gradYear (player's class), not seasonYear, disambiguates a
    // same-name collision -- same convention used everywhere else.
    // Staff have no grad-year concept at all.
    const playerId = recipientType === 'player' ? await resolvePlayerId(recipientName, gradYear) : null;
    const staffId = recipientType === 'staff' ? await resolveStaffId(recipientName) : null;

    const { rows } = await pool.query(
      `INSERT INTO season_honors
         (team_id, recipient_type, player_id, staff_id, player_name, position, honor_source, honor_label, season_year, grad_year, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, season_year, grad_year, position, honor_source, honor_label, player_id, staff_id, player_name, note, recipient_type`,
      [teamId, recipientType, playerId, staffId, recipientName, position, honorSource, honorLabel, seasonYear, gradYear, note]
    );

    return jsonNoStore({ honor: rows[0] });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
