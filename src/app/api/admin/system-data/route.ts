import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getCachedRows();
    const universes = uniRows.map(r => ({
      id: r.get('id'), userId: r.get('userId'), name: r.get('name'), 
      description: r.get('description'), imageUrl: r.get('imageUrl'), 
      isPublic: r.get('isPublic'), createdAt: r.get('createdAt')
    }));

    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getCachedRows();
    const collaborations = collabRows.map(r => ({
      id: r.get('id'), universeId: r.get('universeId'), userId: r.get('userId'), 
      role: r.get('role'), joinedAt: r.get('joinedAt')
    }));

    const msgSheet = await getSheet(SHEET_NAMES.MESSAGES);
    const msgRows = await msgSheet.getCachedRows();
    const messages = msgRows.map(r => ({
      id: r.get('id'), universeId: r.get('universeId'), senderId: r.get('senderId'), 
      content: r.get('content'), createdAt: r.get('createdAt')
    }));

    return NextResponse.json({ universes, collaborations, messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
