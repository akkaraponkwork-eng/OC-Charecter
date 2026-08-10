import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const authorId = url.searchParams.get('authorId');
    
    const sheet = await getSheet(SHEET_NAMES.STORIES);
    const rows = await sheet.getCachedRows();

    const stories = rows.map((r) => ({
      id: r.get('id'),
      authorId: r.get('authorId'),
      title: r.get('title'),
      description: r.get('description'),
      coverImage: r.get('coverImage'),
      isPublic: r.get('isPublic') === 'true',
      createdAt: r.get('createdAt'),
      updatedAt: r.get('updatedAt'),
      // Don't send heavy JSON fields like chapters/maps/timeline in the list view to save bandwidth
    }));

    // If authorId is provided, return stories for that author (including private if they are the author)
    if (authorId) {
      const filtered = stories.filter(s => s.authorId === authorId && (s.isPublic || (session && (session.user as any).uid === authorId)));
      return NextResponse.json(filtered);
    }

    // Default: return only public stories
    const publicStories = stories.filter(s => s.isPublic);
    return NextResponse.json(publicStories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = (session.user as any).uid;

    const body = await req.json();
    const { title, description, coverImage, isPublic, settings } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const sheet = await getSheet(SHEET_NAMES.STORIES);
    const id = 'story_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
    
    const now = new Date().toISOString();
    
    const defaultSettings = {
      enableMaps: true,
      enableTimeline: true,
      enableChapters: true,
      enableRelationships: true,
    };

    const newStory = {
      id,
      authorId: uid,
      title: title.trim(),
      description: description?.trim() || '',
      coverImage: coverImage || '',
      isPublic: isPublic ? 'true' : 'false',
      chapters: '[]',
      timeline: '[]',
      maps: '[]',
      characters: '[]',
      settings: JSON.stringify(settings || defaultSettings),
      createdAt: now,
      updatedAt: now,
    };

    await sheet.addRow(newStory);

    return NextResponse.json({ 
      ...newStory, 
      isPublic: newStory.isPublic === 'true',
      chapters: [],
      timeline: [],
      maps: [],
      characters: [],
      settings: settings || defaultSettings
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
