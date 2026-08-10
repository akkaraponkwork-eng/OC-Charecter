import { NextResponse } from 'next/server';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  try {
    const messagesSheet = await getSheet(SHEET_NAMES.MESSAGES);
    const socialSheet = await getSheet(SHEET_NAMES.SOCIAL_BOARD);

    const messagesRows = await messagesSheet.getRows();
    
    // Find all social_board posts in messages sheet
    const socialPosts = messagesRows.filter(r => r.get('chatId') === 'social_board');

    for (const post of socialPosts) {
      await socialSheet.addRow({
        id: post.get('id'),
        chatId: post.get('chatId'),
        senderId: post.get('senderId'),
        senderName: post.get('senderName'),
        senderAvatar: post.get('senderAvatar'),
        content: post.get('content'),
        readBy: post.get('readBy'),
        createdAt: post.get('createdAt')
      });
      // Optionally delete from old sheet
      await post.delete();
    }

    return NextResponse.json({ success: true, migrated: socialPosts.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
