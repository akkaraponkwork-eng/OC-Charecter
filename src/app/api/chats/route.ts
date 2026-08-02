import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const msgSheet = await getSheet(SHEET_NAMES.MESSAGES);
    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);

    const msgRows = await msgSheet.getCachedRows();
    const userRows = await usersSheet.getCachedRows();
    const groupRows = await groupSheet.getCachedRows();

    const currentUser = userRows.find(r => r.get('uid') === uid);
    const isAdmin = currentUser?.get('role') === 'admin';

    const chats: any[] = [];

    // 1. Group Chats
    groupRows.forEach((r) => {
      const memberIds = JSON.parse(r.get('memberIds') || '[]');
      if (isAdmin || memberIds.includes(uid)) {
        chats.push({
          id: r.get('id'),
          title: r.get('name'),
          type: 'group',
          coverUrl: r.get('coverUrl') || null,
          memberCount: memberIds.length,
          isOwner: r.get('ownerId') === uid
        });
      }
    });

    // 2. Get DMs
    const dmChats = new Set<string>();
    msgRows.forEach((r) => {
      const chatId = r.get('chatId');
      if (chatId?.startsWith('dm_') && chatId.includes(uid)) {
        dmChats.add(chatId);
      }
    });

    Array.from(dmChats).forEach((chatId) => {
      // chatId format: dm_uid1_uid2
      const parts = chatId.replace('dm_', '').split('_');
      const otherUid = parts[0] === uid ? parts[1] : parts[0];
      const otherUser = userRows.find(r => r.get('uid') === otherUid);
      if (otherUser) {
        chats.push({
          id: chatId,
          title: otherUser.get('displayName') || otherUser.get('username'),
          type: 'dm',
          coverUrl: otherUser.get('avatarUrl') || null,
        });
      }
    });

    // 3. Attach latest message for all chats
    chats.forEach(chat => {
      // Find all messages for this chat
      const chatMsgs = msgRows.filter(r => r.get('chatId') === chat.id);
      if (chatMsgs.length > 0) {
        // Sort by date descending
        chatMsgs.sort((a, b) => new Date(b.get('createdAt')).getTime() - new Date(a.get('createdAt')).getTime());
        const latest = chatMsgs[0];
        chat.latestMessage = {
          content: latest.get('content'),
          senderName: latest.get('senderName'),
          createdAt: latest.get('createdAt')
        };
      }
    });

    // Sort chats by latest message date (descending)
    chats.sort((a, b) => {
      const timeA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const timeB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json(chats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
