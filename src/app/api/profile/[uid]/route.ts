import { NextRequest, NextResponse } from 'next/server';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { auth } from '@/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getCachedRows();
    const user = rows.find((r) => r.get('uid') === uid);

    const session = await auth();
    const myUid = (session?.user as any)?.uid;
    const isAdmin = (session?.user as any)?.role === 'admin';

    if (!user || (user.get('isPublic') !== 'true' && user.get('uid') !== myUid && !isAdmin))
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Get ALL universes for this user
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getCachedRows();
    const universes = uniRows.filter(
      (r) => r.get('userId') === uid && (r.get('isPublic') === 'true' || uid === myUid || isAdmin)
    ).map((r) => {
      const isPublic = r.get('isPublic') === 'true';
      return {
        id: r.get('id'), name: r.get('name'), coverUrl: r.get('coverUrl'), isPublic
      };
    });

    // Get characters for this user (respect privacy)
    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const charRows = await charSheet.getCachedRows();
    const characters = charRows.filter(
      (r) => r.get('userId') === uid && (r.get('isPublic') === 'true' || uid === myUid || isAdmin)
    ).map((r) => {
      const isPublic = r.get('isPublic') === 'true';
      return {
        id: r.get('id'), name: r.get('name'), imageUrl: r.get('imageUrl'), isPublic
      };
    });

    return NextResponse.json({
      uid: user.get('uid'),
      displayName: user.get('displayName') || user.get('username'),
      username: user.get('username'),
      avatarUrl: user.get('avatarUrl'),
      bio: user.get('bio'),
      socialLinks: (() => { try { return JSON.parse(user.get('socialLinks') || '{}'); } catch { return {}; } })(),
      isPublic: user.get('isPublic') === 'true',
      role: user.get('role'),
      universes,
      characters,
      createdAt: user.get('createdAt'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
