import { NextResponse } from 'next/server';
import { commitTeamImport } from '@/lib/importService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { gameMeta, stats, fileName } = body;

    if (!gameMeta || !stats) {
      return NextResponse.json({ error: 'Missing gameMeta or stats' }, { status: 400 });
    }

    const result = await commitTeamImport(gameMeta, stats, fileName);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong. Check the server logs for details.' }, { status: 500 });
  }
}
