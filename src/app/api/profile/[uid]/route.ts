import { NextRequest, NextResponse } from 'next/server';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getCachedRows();
    const user = rows.find((r) => r.get('uid') === uid);

    if (!user || user.get('isPublic') !== 'true')
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Get public universes count
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getCachedRows();
    const publicUniverses = uniRows.filter(
      (r) => r.get('userId') === uid && r.get('isPublic') === 'true'
    ).map((r) => ({
      id: r.get('id'), name: r.get('name'), coverUrl: r.get('coverUrl'),
    }));

    return NextResponse.json({
      uid: user.get('uid'),
      displayName: user.get('displayName') || user.get('username'),
      username: user.get('username'),
      avatarUrl: user.get('avatarUrl'),
      bio: user.get('bio'),
      socialLinks: (() => { try { return JSON.parse(user.get('socialLinks') || '{}'); } catch { return {}; } })(),
      publicUniverses,
      createdAt: user.get('createdAt'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
