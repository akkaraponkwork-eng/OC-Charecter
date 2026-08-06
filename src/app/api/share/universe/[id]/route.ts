import { NextRequest, NextResponse } from 'next/server';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const rows = await sheet.getCachedRows();
    const row = rows.find((r) => r.get('id') === id);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const isPublic = String(row.get('isPublic')).toLowerCase() !== 'false';
    if (!isPublic) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch creator info
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getCachedRows();
    const creator = userRows.find((u) => u.get('uid') === row.get('userId'));

    // Filter stories to only public ones
    const stories = (row.get('stories') ? JSON.parse(row.get('stories')) : []).filter((s: any) => !s.isLocked);

    // Fetch characters in this universe
    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const charRows = await charSheet.getCachedRows();
    const characters = charRows
      .filter((r) => {
        const uIdsStr = r.get('universeId') || '';
        const currentIds = uIdsStr.split(',').map((uId: string) => uId.trim()).filter(Boolean);
        return currentIds.includes(id) && String(r.get('isPublic')).toLowerCase() !== 'false';
      })
      .map((r) => ({
        id: r.get('id'),
        name: r.get('name'),
        imageUrl: r.get('imageUrl'),
        bio: r.get('bio'),
        tags: r.get('tags') ? r.get('tags').split(',').map((t: string) => t.trim()) : [],
      }));

    return NextResponse.json({
      id: row.get('id'),
      name: row.get('name'),
      description: row.get('description'),
      coverUrl: row.get('coverUrl'),
      stories,
      characters,
      creatorName: creator?.get('displayName') || creator?.get('username') || 'Unknown',
      creatorUid: row.get('userId'),
      createdAt: row.get('createdAt'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
