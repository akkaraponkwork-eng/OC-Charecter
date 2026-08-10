import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const id = (await params).id;
    
    const sheet = await getSheet(SHEET_NAMES.STORIES);
    const rows = await sheet.getCachedRows();
    const row = rows.find(r => r.get('id') === id);

    if (!row) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const story = {
      id: row.get('id'),
      authorId: row.get('authorId'),
      title: row.get('title'),
      description: row.get('description'),
      coverImage: row.get('coverImage'),
      isPublic: row.get('isPublic') === 'true',
      chapters: JSON.parse(row.get('chapters') || '[]'),
      timeline: JSON.parse(row.get('timeline') || '[]'),
      maps: JSON.parse(row.get('maps') || '[]'),
      characters: JSON.parse(row.get('characters') || '[]'),
      settings: JSON.parse(row.get('settings') || '{}'),
      createdAt: row.get('createdAt'),
      updatedAt: row.get('updatedAt'),
    };

    const isAuthor = session && (session.user as any).uid === story.authorId;

    if (!story.isPublic && !isAuthor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Filter out locked chapter content if not author
    if (!isAuthor && story.chapters) {
      story.chapters = story.chapters.map((ch: any) => ({
        ...ch,
        content: ch.isLocked ? '' : ch.content,
      }));
    }

    return NextResponse.json(story);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const id = (await params).id;
    const body = await req.json();
    
    const sheet = await getSheet(SHEET_NAMES.STORIES);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === id);

    if (!row) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    if (row.get('authorId') !== (session.user as any).uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (body.title !== undefined) row.set('title', body.title);
    if (body.description !== undefined) row.set('description', body.description);
    if (body.coverImage !== undefined) row.set('coverImage', body.coverImage);
    if (body.isPublic !== undefined) row.set('isPublic', body.isPublic ? 'true' : 'false');
    
    if (body.chapters !== undefined) row.set('chapters', JSON.stringify(body.chapters));
    if (body.timeline !== undefined) row.set('timeline', JSON.stringify(body.timeline));
    if (body.maps !== undefined) row.set('maps', JSON.stringify(body.maps));
    if (body.characters !== undefined) row.set('characters', JSON.stringify(body.characters));
    if (body.settings !== undefined) row.set('settings', JSON.stringify(body.settings));

    row.set('updatedAt', new Date().toISOString());
    await row.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const id = (await params).id;
    const sheet = await getSheet(SHEET_NAMES.STORIES);
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === id);

    if (!row) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    if (row.get('authorId') !== (session.user as any).uid && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await row.delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
