import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getCachedRows();
    const characters = rows.map((r) => ({
      id: r.get('id'),
      universeId: r.get('universeId'),
      userId: r.get('userId'),
      name: r.get('name'),
      imageUrl: r.get('imageUrl'),
      createdAt: r.get('createdAt'),
    }));
    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getRows();
    const character = rows.find((r) => r.get('id') === id);
    if (!character) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await character.delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
