import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

type Params = { params: Promise<{ id: string }> };

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

    // Cascade: delete characters in this universe
    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const charRows = await charSheet.getRows();
    for (const r of charRows) {
      if (r.get('universeId') === id) await r.delete();
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
