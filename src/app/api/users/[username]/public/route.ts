import { NextRequest, NextResponse } from 'next/server';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  try {
    const userSheet = await getSheet(SHEET_NAMES.USERS);
    const users = await userSheet.getCachedRows();
    const targetUser = users.find(r => r.get('username') === username);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const uid = targetUser.get('uid');

    const isUserPublic = targetUser.get('isPublic') === 'true';

    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const chars = await charSheet.getCachedRows();
    const publicCharacters = isUserPublic ? chars
      .filter(r => r.get('userId') === uid)
      .map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        imageUrl: r.get('imageUrl'),
        shortDescription: r.get('shortDescription')
      })) : [];

    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const unis = await uniSheet.getCachedRows();
    const publicUniverses = isUserPublic ? unis
      .filter(r => r.get('userId') === uid)
      .map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        imageUrl: r.get('imageUrl'),
        description: r.get('description')
      })) : [];

    return NextResponse.json({
      profile: {
        uid,
        username: targetUser.get('username'),
        displayName: targetUser.get('displayName'),
        avatarUrl: targetUser.get('avatarUrl'),
        bio: targetUser.get('bio')
      },
      characters: publicCharacters,
      universes: publicUniverses
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
