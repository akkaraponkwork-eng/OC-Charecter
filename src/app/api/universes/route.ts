import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { v4 as uuidv4 } from 'uuid';

// GET /api/universes — list current user's universes + shared universes
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';

  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);

    const rows = await sheet.getCachedRows();
    const collabRows = await collabSheet.getCachedRows();

    // Universes I own OR collaborate in
    const collabUniverseIds = collabRows
      .filter((r) => r.get('userId') === uid && r.get('status') === 'accepted')
      .map((r) => r.get('universeId'));

    const universes = rows
      .filter((r) => isAdmin || r.get('userId') === uid || collabUniverseIds.includes(r.get('id')))
      .map((r) => ({
        id: r.get('id'),
        userId: r.get('userId'),
        name: r.get('name'),
        description: r.get('description'),
        coverUrl: r.get('coverUrl'),
        isPublic: r.get('isPublic') === 'true',
        createdAt: r.get('createdAt'),
        isCollaborator: collabUniverseIds.includes(r.get('id')),
      }));

    return NextResponse.json(universes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/universes — create universe
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const { name, description, coverUrl } = await req.json();

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const id = uuidv4();
    await sheet.addRow({
      id, userId: uid, name, description: description || '',
      coverUrl: coverUrl || '', isPublic: 'false',
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id, userId: uid, name, description, coverUrl, isPublic: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
