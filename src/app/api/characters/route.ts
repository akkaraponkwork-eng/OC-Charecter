import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { v4 as uuidv4 } from 'uuid';

// GET /api/characters?universeId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';
  const universeId = req.nextUrl.searchParams.get('universeId');

  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const rows = await sheet.getCachedRows();
    const collabRows = await collabSheet.getCachedRows();

    const allowedUniverseIds = collabRows
      .filter((r) => r.get('userId') === uid && r.get('status') === 'accepted')
      .map((r) => r.get('universeId'));

    const characters = rows
      .filter((r) => {
        if (isAdmin) return true;
        if (universeId) return r.get('universeId') === universeId && (r.get('userId') === uid || allowedUniverseIds.includes(universeId));
        return r.get('userId') === uid || allowedUniverseIds.includes(r.get('universeId'));
      })
      .map((r) => ({
        id: r.get('id'),
        userId: r.get('userId'),
        universeId: r.get('universeId'),
        name: r.get('name'),
        statsJSON: (() => { try { return JSON.parse(r.get('statsJSON') || '{}'); } catch { return {}; } })(),
        tags: r.get('tags') ? r.get('tags').split(',').map((t: string) => t.trim()) : [],
        imageUrl: r.get('imageUrl'),
        bio: r.get('bio'),
        isPublic: r.get('isPublic') === 'true',
        createdAt: r.get('createdAt'),
      }));

    return NextResponse.json(characters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/characters
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const body = await req.json();
  const { universeId, name, bio, statsJSON, tags, imageUrl } = body;
  if (!universeId || !name) return NextResponse.json({ error: 'universeId and name required' }, { status: 400 });

  try {
    // Verify access to universe
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getRows();
    const collabRows = await collabSheet.getRows();
    const universe = uniRows.find((r) => r.get('id') === universeId);
    if (!universe) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });

    const isOwner = universe.get('userId') === uid;
    const isCollaborator = collabRows.some(
      (r) => r.get('universeId') === universeId && r.get('userId') === uid && r.get('status') === 'accepted'
    );
    if (!isOwner && !isCollaborator)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const id = uuidv4();
    await sheet.addRow({
      id, userId: uid, universeId, name,
      statsJSON: JSON.stringify(statsJSON || {}),
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      imageUrl: imageUrl || '',
      bio: bio || '',
      isPublic: 'false',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id, userId: uid, universeId, name, statsJSON, tags, imageUrl, bio, isPublic: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
