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

    if (targetUser.get('isPublic') !== 'true') {
      return NextResponse.json({ error: 'This profile is private' }, { status: 403 });
    }

    const uid = targetUser.get('uid');

    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const chars = await charSheet.getCachedRows();
    const publicCharacters = chars
      .filter(r => r.get('userId') === uid && r.get('isPublic') === 'true')
      .map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        imageUrl: r.get('imageUrl'),
        shortDescription: r.get('shortDescription')
      }));

    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const unis = await uniSheet.getCachedRows();
    const publicUniverses = unis
      .filter(r => r.get('userId') === uid && r.get('isPublic') === 'true')
      .map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        imageUrl: r.get('imageUrl'),
        description: r.get('description')
      }));

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
