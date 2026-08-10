import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getCachedRows();
    const row = rows.find((r) => r.get('id') === id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const ownerId = row.get('userId');
    const isPublic = String(row.get('isPublic')).toLowerCase() !== 'false';

    const session = await auth();
    const uid = (session?.user as any)?.uid;
    const isAdmin = (session?.user as any)?.role === 'admin';

    const character = {
      id: row.get('id'),
      userId: row.get('userId'),
      universeId: row.get('universeId'),
      universeIds: row.get('universeId') ? row.get('universeId').split(',').map((id: string) => id.trim()).filter(Boolean) : [],
      name: row.get('name'),
      statsJSON: (() => { 
        try { 
          const parsed = JSON.parse(row.get('statsJSON') || '{}');
          if (parsed.stories && Array.isArray(parsed.stories)) {
            parsed.stories = parsed.stories.map((s: any) => {
              if (isAdmin || ownerId === uid) return s;
              if (s.isLocked) return { ...s, description: '' };
              return s;
            });
          }
          return parsed;
        } catch { return {}; } 
      })(),
      tags: row.get('tags') ? row.get('tags').split(',').map((t: string) => t.trim()) : [],
      imageUrl: row.get('imageUrl'),
      bio: row.get('bio'),
      isPublic,
      createdAt: row.get('createdAt'),
    };
    return NextResponse.json(character);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';
  const body = await req.json();

  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getCachedRows();
    const row = rows.find((r) => r.get('id') === id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const isCharOwner = row.get('userId') === uid;

    let isUniverseOwnerForRemoval = false;
    if (body.removeUniverseId) {
      const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
      const uniRows = await uniSheet.getCachedRows();
      const uniRow = uniRows.find(r => r.get('id') === body.removeUniverseId);
      if (uniRow && uniRow.get('userId') === uid) {
        isUniverseOwnerForRemoval = true;
      }
    }

    if (!isAdmin && !isCharOwner && !isUniverseOwnerForRemoval) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only Admin and Character Owner can edit character details
    if (isAdmin || isCharOwner) {
      if (body.name !== undefined) row.set('name', body.name);
      if (body.bio !== undefined) row.set('bio', body.bio);
      if (body.imageUrl !== undefined) row.set('imageUrl', body.imageUrl);
      if (body.tags !== undefined) row.set('tags', Array.isArray(body.tags) ? body.tags.join(',') : body.tags);
      if (body.statsJSON !== undefined) row.set('statsJSON', JSON.stringify(body.statsJSON));
      if (body.isPublic !== undefined) row.set('isPublic', String(body.isPublic));
      
      if (body.addUniverseId) {
        const currentIds = row.get('universeId') ? row.get('universeId').split(',').map((id: string) => id.trim()).filter(Boolean) : [];
        if (!currentIds.includes(body.addUniverseId)) {
          currentIds.push(body.addUniverseId);
          row.set('universeId', currentIds.join(','));
        }
      } else if (body.universeId !== undefined) {
        row.set('universeId', body.universeId);
      }
    }

    // Universe Owner, Admin, and Character Owner can remove from universe
    if (body.removeUniverseId) {
      const currentIds = row.get('universeId') ? row.get('universeId').split(',').map((id: string) => id.trim()).filter(Boolean) : [];
      const newIds = currentIds.filter((id: string) => id !== body.removeUniverseId);
      row.set('universeId', newIds.join(','));
    }
    
    await row.save();
    clearSheetCache(SHEET_NAMES.CHARACTERS);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';

  try {
    const sheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!isAdmin && row.get('userId') !== uid)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await row.delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
