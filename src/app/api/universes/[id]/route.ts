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


    let rawDesc = row.get('description') || '';
    let cleanDesc = rawDesc;
    let parsedStories = [];

    if (rawDesc.includes('---STORIES---')) {
      const parts = rawDesc.split('---STORIES---');
      cleanDesc = parts[0];
      try { parsedStories = JSON.parse(parts[1]); } catch(e){}
    }

    return NextResponse.json({
      id: row.get('id'),
      userId: ownerId,
      name: row.get('name'),
      description: cleanDesc,
      coverUrl: row.get('coverUrl'),
      isPublic,
      createdAt: row.get('createdAt'),
      isCollaborator,
      stories: parsedStories.map((s: any) => {
        if (isAdmin || ownerId === uid || isCollaborator) return s;
        if (s.isLocked) return { ...s, description: '' };
        return s;
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
    if (body.coverUrl !== undefined) row.set('coverUrl', body.coverUrl);
    if (body.isPublic !== undefined) row.set('isPublic', String(body.isPublic));

    let currentRawDesc = row.get('description') || '';
    let currentDesc = currentRawDesc;
    let currentStoriesStr = '';

    if (currentRawDesc.includes('---STORIES---')) {
      const parts = currentRawDesc.split('---STORIES---');
      currentDesc = parts[0];
      currentStoriesStr = parts[1];
    }

    if (body.description !== undefined) {
      currentDesc = body.description;
    }
    if (body.stories !== undefined) {
      currentStoriesStr = typeof body.stories === 'string' ? body.stories : (body.stories.length > 0 ? JSON.stringify(body.stories) : '');
    }

    let finalDesc = currentDesc;
    if (currentStoriesStr) {
      finalDesc += '---STORIES---' + currentStoriesStr;
    }
    row.set('description', finalDesc);

    await row.save();
    clearSheetCache(SHEET_NAMES.UNIVERSES);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/universes/[id] — collaborators can add stories (not edit core info)
export async function PATCH(req: NextRequest, { params }: Params) {
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

    const ownerId = row.get('userId');
    const isOwner = ownerId === uid;

    // Check if collaborator
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getCachedRows();
    const isCollaborator = collabRows.some(
      (r) => r.get('universeId') === id && r.get('userId') === uid && r.get('status') === 'accepted'
    );

    if (!isOwner && !isAdmin && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse existing stories
    const rawDesc = row.get('description') || '';
    let cleanDesc = rawDesc;
    let parsedStories: any[] = [];

    if (rawDesc.includes('---STORIES---')) {
      const parts = rawDesc.split('---STORIES---');
      cleanDesc = parts[0];
      try { parsedStories = JSON.parse(parts[1]); } catch (e) {}
    }

    // action: 'add' | 'delete'
    const { action, story, storyId } = body;

    if (action === 'add') {
      if (!story?.title?.trim()) return NextResponse.json({ error: 'Story title required' }, { status: 400 });
      const newStory = {
        id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: story.title.trim(),
        description: story.description?.trim() || '',
        isLocked: story.isLocked === true,
        addedBy: uid,
      };
      parsedStories.push(newStory);
    } else if (action === 'delete') {
      if (!storyId) return NextResponse.json({ error: 'storyId required' }, { status: 400 });
      const target = parsedStories.find((s) => s.id === storyId);
      if (!target) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
      // Only owner/admin can delete others' stories; collaborators can delete their own
      if (!isOwner && !isAdmin && target.addedBy !== uid) {
        return NextResponse.json({ error: 'Forbidden: Only owner or admin can delete this story' }, { status: 403 });
      }
      parsedStories = parsedStories.filter((s) => s.id !== storyId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const storiesStr = parsedStories.length > 0 ? JSON.stringify(parsedStories) : '';
    const finalDesc = storiesStr ? cleanDesc + '---STORIES---' + storiesStr : cleanDesc;
    row.set('description', finalDesc);
    await row.save();
    clearSheetCache(SHEET_NAMES.UNIVERSES);

    return NextResponse.json({ success: true, stories: parsedStories });
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
