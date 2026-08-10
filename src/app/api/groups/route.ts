import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

async function checkAdmin(uid: string): Promise<boolean> {
  const usersSheet = await getSheet(SHEET_NAMES.USERS);
  const rows = await usersSheet.getCachedRows();
  const user = rows.find(r => r.get('uid') === uid);
  return user?.get('role') === 'admin';
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groupRows = await groupSheet.getCachedRows();
    const admin = await checkAdmin(uid);

    const groups = groupRows
      .filter(r => {
        const memberIds = JSON.parse(r.get('memberIds') || '[]');
        return admin || memberIds.includes(uid);
      })
      .map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        ownerId: r.get('ownerId'),
        memberIds: JSON.parse(r.get('memberIds') || '[]'),
        coverUrl: r.get('coverUrl') || null,
        createdAt: r.get('createdAt'),
      }));

    return NextResponse.json(groups);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const { name, memberIds } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await groupSheet.addRow({
      id: groupId,
      name,
      ownerId: uid,
      memberIds: JSON.stringify(Array.from(new Set([uid, ...(memberIds || [])]))),
      coverUrl: '',
      createdAt: new Date().toISOString()
    });

    clearSheetCache(SHEET_NAMES.CHAT_GROUPS);

    return NextResponse.json({ id: groupId, name, ownerId: uid, memberIds: Array.from(new Set([uid, ...(memberIds || [])])) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const { groupId, name, memberIds } = await req.json();
    if (!groupId) return NextResponse.json({ error: 'groupId is required' }, { status: 400 });

    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groups = await groupSheet.getCachedRows();
    const group = groups.find(r => r.get('id') === groupId);

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const admin = await checkAdmin(uid);
    if (group.get('ownerId') !== uid && !admin) {
      return NextResponse.json({ error: 'Only the group owner or admin can update this group' }, { status: 403 });
    }

    if (name) group.set('name', name);
    if (Array.isArray(memberIds)) {
      // Ensure owner is always in the group
      const newMembers = Array.from(new Set([group.get('ownerId'), ...memberIds]));
      group.set('memberIds', JSON.stringify(newMembers));
    }
    
    await group.save();
    clearSheetCache(SHEET_NAMES.CHAT_GROUPS);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const { groupId } = await req.json();
    if (!groupId) return NextResponse.json({ error: 'groupId is required' }, { status: 400 });

    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groups = await groupSheet.getCachedRows();
    const group = groups.find(r => r.get('id') === groupId);

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const admin = await checkAdmin(uid);
    if (group.get('ownerId') !== uid && !admin) {
      return NextResponse.json({ error: 'Only the group owner or admin can delete this group' }, { status: 403 });
    }

    // Delete all messages in this group
    const msgSheet = await getSheet(SHEET_NAMES.MESSAGES);
    const msgRows = await msgSheet.getCachedRows();
    const groupMsgs = msgRows.filter(r => r.get('chatId') === groupId);
    for (const msg of groupMsgs) {
      await msg.delete();
    }

    // Delete the group
    await group.delete();

    clearSheetCache(SHEET_NAMES.CHAT_GROUPS);
    clearSheetCache(SHEET_NAMES.MESSAGES);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

