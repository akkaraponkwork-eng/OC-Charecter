import { NextRequest, NextResponse } from 'next/server';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getCachedRows();
    const row = rows.find((r) => r.get('id') === id);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });


    // Fetch creator info
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getCachedRows();
    const creator = userRows.find((u) => u.get('uid') === row.get('userId'));

    return NextResponse.json({
      id: row.get('id'), name: row.get('name'), bio: row.get('bio'),
      imageUrl: row.get('imageUrl'),
      statsJSON: (() => { try { return JSON.parse(row.get('statsJSON') || '{}'); } catch { return {}; } })(),
      tags: row.get('tags') ? row.get('tags').split(',').map((t: string) => t.trim()) : [],
      creatorName: creator?.get('displayName') || creator?.get('username') || 'Unknown',
      creatorUid: row.get('userId'),
      createdAt: row.get('createdAt'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
