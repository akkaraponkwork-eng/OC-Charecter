import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';
import { v4 as uuidv4 } from 'uuid';
import { generateDmChatId } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;
  const chatId = req.nextUrl.searchParams.get('chatId');
  if (!chatId) return NextResponse.json({ error: 'chatId required' }, { status: 400 });

  // Security: user must be part of this chat
  const isDm = chatId.startsWith('dm_');
  const isUniverse = chatId.startsWith('universe_');

  if (isDm && !chatId.includes(uid))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (isUniverse) {
    const universeId = chatId.replace('universe_', '');
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const uniRows = await uniSheet.getCachedRows();
    const collabRows = await collabSheet.getCachedRows();
    const uni = uniRows.find((r) => r.get('id') === universeId);
    const isOwner = uni?.get('userId') === uid;
    const isCollab = collabRows.some((r) => r.get('universeId') === universeId && r.get('userId') === uid && r.get('status') === 'accepted');
    if (!isOwner && !isCollab) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const isGroup = chatId.startsWith('group_');
  if (isGroup) {
    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groups = await groupSheet.getCachedRows();
    const group = groups.find((r) => r.get('id') === chatId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const memberIds = JSON.parse(group.get('memberIds') || '[]');
    
    // Check if user is admin for stealth mode
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getCachedRows();
    const user = userRows.find((r) => r.get('uid') === uid);
    const isAdmin = user?.get('role') === 'admin';

    if (!memberIds.includes(uid) && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const sheet = await getSheet(SHEET_NAMES.MESSAGES);
    const rows = await sheet.getCachedRows();
    const messages = rows
      .filter((r) => r.get('chatId') === chatId)
      .map((r) => ({
        id: r.get('id'), chatId: r.get('chatId'),
        senderId: r.get('senderId'), senderName: r.get('senderName'),
        senderAvatar: r.get('senderAvatar'), content: r.get('content'),
        readBy: r.get('readBy') ? JSON.parse(r.get('readBy') || '[]') : [],
        createdAt: r.get('createdAt'),
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;
  const { chatId, content, recipientId } = await req.json();

  // Allow building DM chatId from recipientId
  const resolvedChatId = recipientId ? generateDmChatId(uid, recipientId) : chatId;
  if (!resolvedChatId || !content?.trim())
    return NextResponse.json({ error: 'chatId and content required' }, { status: 400 });

  if (resolvedChatId.startsWith('group_')) {
    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groups = await groupSheet.getCachedRows();
    const group = groups.find((r) => r.get('id') === resolvedChatId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const memberIds = JSON.parse(group.get('memberIds') || '[]');
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getCachedRows();
    const user = userRows.find((r) => r.get('uid') === uid);
    const isAdmin = user?.get('role') === 'admin';

    if (!memberIds.includes(uid) && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const sheet = await getSheet(SHEET_NAMES.MESSAGES);
    const id = uuidv4();
    const senderName = (session.user as any).username || session.user.name || 'Unknown';
    const senderAvatar = (session.user as any).avatarUrl || session.user.image || '';

    await sheet.addRow({
      id, chatId: resolvedChatId, senderId: uid,
      senderName, senderAvatar, content: content.trim(),
      readBy: '[]',
      createdAt: new Date().toISOString(),
    });
    
    clearSheetCache(SHEET_NAMES.MESSAGES);



    return NextResponse.json({ id, chatId: resolvedChatId, senderId: uid, senderName, senderAvatar, content, createdAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
