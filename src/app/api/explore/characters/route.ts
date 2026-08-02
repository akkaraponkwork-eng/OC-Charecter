import { NextResponse } from 'next/server';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getCachedRows();

    const publicCharacters = rows
      .filter((r) => r.get('isPublic') === 'true' && r.get('imageUrl') && r.get('imageUrl').trim() !== '')
      .map((r) => ({
        id: r.get('id'),
        userId: r.get('userId'),
        universeId: r.get('universeId'),
        name: r.get('name'),
        imageUrl: r.get('imageUrl'),
        bio: r.get('bio'),
      }));

    // Shuffle the characters array randomly
    for (let i = publicCharacters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [publicCharacters[i], publicCharacters[j]] = [publicCharacters[j], publicCharacters[i]];
    }

    return NextResponse.json(publicCharacters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
