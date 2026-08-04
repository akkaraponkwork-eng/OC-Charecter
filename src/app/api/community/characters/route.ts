import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getCachedRows();

    const characters = rows.map((r) => ({
      id: r.get('id'),
      userId: r.get('userId'),
      universeId: r.get('universeId'),
      name: r.get('name'),
      imageUrl: r.get('imageUrl'),
      createdAt: r.get('createdAt'),
      bio: r.get('bio') || '',
      tags: r.get('tags') ? r.get('tags').split(',').map((t: string) => t.trim()) : [],
      statsJSON: (() => { try { return JSON.parse(r.get('statsJSON') || '{}'); } catch { return {}; } })(),
    }));

    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
