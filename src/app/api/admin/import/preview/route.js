import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { previewImport } from '@/lib/importService';
import { pool } from '@/lib/db';

// For MVP there's exactly one team (SJJ). Hardcoding the slug lookup here
// keeps every other layer multi-tenant-ready without needing real auth yet.
async function getDefaultTeamId() {
  const { rows } = await pool.query("SELECT id FROM teams WHERE slug = 'sjj'");
  if (!rows[0]) throw new Error('Default team not found — did you run the schema migration?');
  return rows[0].id;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const csvText = await file.text();
    const teamId = await getDefaultTeamId();

    const preview = await previewImport(teamId, csvText, Papa);
    return NextResponse.json({ teamId, fileName: file.name, ...preview });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
