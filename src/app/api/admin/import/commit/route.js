import { NextResponse } from 'next/server';
import { commitImport } from '@/lib/importService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { gameMeta, previewRows, resolutions, fileName } = body;

    if (!gameMeta || !previewRows) {
      return NextResponse.json({ error: 'Missing gameMeta or previewRows' }, { status: 400 });
    }

    const result = await commitImport(gameMeta, previewRows, resolutions || {}, fileName);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
