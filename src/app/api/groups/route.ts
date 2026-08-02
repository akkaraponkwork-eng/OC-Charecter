import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await groupSheet.addRow({
      id: groupId,
      name,
      ownerId: uid,
      memberIds: JSON.stringify([uid]),
      coverUrl: '',
      createdAt: new Date().toISOString()
    });

    clearSheetCache(SHEET_NAMES.CHAT_GROUPS);

    return NextResponse.json({ id: groupId, name, ownerId: uid, memberIds: [uid] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
