import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

type Params = { params: Promise<{ id: string }> };

// GET /api/universes/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const rows = await sheet.getCachedRows();
    const row = rows.find((r) => r.get('id') === id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPublic = String(row.get('isPublic')).toLowerCase() !== 'false';
    const ownerId = row.get('userId');
    let isCollaborator = false;

    const session = await auth();
    const uid = (session?.user as any)?.uid;
    const isAdmin = (session?.user as any)?.role === 'admin';

    if (uid) {
      const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
      const collabRows = await collabSheet.getCachedRows();
      isCollaborator = collabRows.some(
        (r) => r.get('universeId') === id && r.get('userId') === uid && r.get('status') === 'accepted'
      );
    }


    return NextResponse.json({
      id: row.get('id'),
      userId: ownerId,
      name: row.get('name'),
      description: row.get('description'),
      coverUrl: row.get('coverUrl'),
      isPublic,
      createdAt: row.get('createdAt'),
      isCollaborator,
      stories: (row.get('stories') ? JSON.parse(row.get('stories')) : []).filter((s: any) => {
        if (isAdmin || ownerId === uid || isCollaborator) return true;
        return !s.isLocked;
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// PUT /api/universes/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';
  const body = await req.json();

  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const rows = await sheet.getCachedRows();
    const row = rows.find((r) => r.get('id') === id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!isAdmin && row.get('userId') !== uid)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (body.name !== undefined) row.set('name', body.name);
    if (body.description !== undefined) row.set('description', body.description);
    if (body.coverUrl !== undefined) row.set('coverUrl', body.coverUrl);
    if (body.isPublic !== undefined) row.set('isPublic', String(body.isPublic));
    if (body.stories !== undefined) row.set('stories', typeof body.stories === 'string' ? body.stories : JSON.stringify(body.stories));
    await row.save();
    clearSheetCache(SHEET_NAMES.UNIVERSES);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/universes/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';

  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!isAdmin && row.get('userId') !== uid)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await row.delete();

    // Cascade: detach characters from this universe instead of deleting them
    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const charRows = await charSheet.getRows();
    for (const r of charRows) {
      const uIdsStr = r.get('universeId') || '';
      const currentIds = uIdsStr.split(',').map((uId: string) => uId.trim()).filter(Boolean);
      if (currentIds.includes(id)) {
        const newIds = currentIds.filter((uId: string) => uId !== id);
        r.set('universeId', newIds.join(','));
        await r.save();
      }
    }

    // Cascade: delete collaborations
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getRows();
    for (const r of collabRows) {
      if (r.get('universeId') === id) await r.delete();
    }

    // Cascade: delete messages
    const msgSheet = await getSheet(SHEET_NAMES.MESSAGES);
    const msgRows = await msgSheet.getRows();
    for (const r of msgRows) {
      if (r.get('chatId') === `universe_${id}`) await r.delete();
    }

    clearSheetCache(SHEET_NAMES.UNIVERSES);
    clearSheetCache(SHEET_NAMES.CHARACTERS);
    clearSheetCache(SHEET_NAMES.COLLABORATIONS);
    clearSheetCache(SHEET_NAMES.MESSAGES);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
