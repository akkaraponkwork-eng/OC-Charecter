import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const msgSheet = await getSheet(SHEET_NAMES.MESSAGES);

    const uniRows = await uniSheet.getCachedRows();
    const collabRows = await collabSheet.getCachedRows();
    const msgRows = await msgSheet.getCachedRows();
    const userRows = await usersSheet.getCachedRows();

    const chats: any[] = [];

    // 1. Get Universes (Owned or Collaborated)
    const myCollabs = collabRows
      .filter((r) => r.get('userId') === uid && r.get('status') === 'accepted')
      .map((r) => r.get('universeId'));
    
    uniRows.forEach((r) => {
      if (r.get('userId') === uid || myCollabs.includes(r.get('id'))) {
        chats.push({
          id: `universe_${r.get('id')}`,
          title: r.get('name'),
          type: 'universe',
          coverUrl: r.get('coverUrl') || null,
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
