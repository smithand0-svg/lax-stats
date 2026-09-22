import { jsonNoStore } from '@/lib/apiResponse';
import { pool } from '@/lib/db';
import { getDefaultTeamId, resolvePlayerId } from '@/lib/adminAwards';

export const dynamic = 'force-dynamic';

const TEAM_LEVELS = ['Varsity', 'JV Gold', 'JV Blue'];
const AWARD_CATEGORIES = ['Coaches Award', 'Rookie Award', 'Anchor Award', 'E&A', 'Most Improved', 'D MVP', 'O MVP', 'MVP'];

// GET ?season=YYYY -- list this season's team awards, newest-added first.
export async function GET(request) {
  try {
    const teamId = await getDefaultTeamId();
    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season'), 10);
    if (!Number.isFinite(season)) {
      return jsonNoStore({ error: 'A season year is required.' }, { status: 400 });
    }
    const { rows } = await pool.query(
      `SELECT id, season_year, team_level, award_category, player_id, player_name
       FROM team_awards
       WHERE team_id = $1 AND season_year = $2
       ORDER BY id DESC`,
      [teamId, season]
    );
    return jsonNoStore({ awards: rows });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const teamId = await getDefaultTeamId();
    const body = await request.json();
    const seasonYear = parseInt(body.seasonYear, 10);
    const teamLevel = body.teamLevel;
    const awardCategory = body.awardCategory;
    const playerName = (body.playerName || '').trim();
    const graduationYear = body.graduationYear ? parseInt(body.graduationYear, 10) : null;

    if (!Number.isFinite(seasonYear)) {
      return jsonNoStore({ error: 'A season year is required.' }, { status: 400 });
    }
    if (!TEAM_LEVELS.includes(teamLevel)) {
      return jsonNoStore({ error: `Team level must be one of: ${TEAM_LEVELS.join(', ')}.` }, { status: 400 });
    }
    if (!AWARD_CATEGORIES.includes(awardCategory)) {
      return jsonNoStore({ error: `Award category must be one of: ${AWARD_CATEGORIES.join(', ')}.` }, { status: 400 });
    }
    if (!playerName) {
      return jsonNoStore({ error: 'A player name is required.' }, { status: 400 });
    }

    const playerId = await resolvePlayerId(playerName, graduationYear);

    const { rows } = await pool.query(
      `INSERT INTO team_awards (team_id, season_year, team_level, award_category, player_id, player_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, season_year, team_level, award_category, player_id, player_name`,
      [teamId, seasonYear, teamLevel, awardCategory, playerId, playerName]
    );

    return jsonNoStore({ award: rows[0] });
  } catch (err) {
    console.error(err);
    return jsonNoStore({ error: err.message }, { status: 500 });
  }
}
