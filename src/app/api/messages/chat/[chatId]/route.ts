import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

type Params = { params: Promise<{ chatId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { chatId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';

  // Only allow if Admin OR it's a DM chat the user is part of
  const isDmParticipant = chatId.startsWith('dm_') && chatId.includes(uid);
  
  if (!isAdmin && !isDmParticipant) {
    // If it's a universe or group chat, we'd ideally check if they are the owner.
    // For now, if it's not a DM and not admin, forbid full wipe.
    return NextResponse.json({ error: 'Forbidden: You cannot wipe this chat' }, { status: 403 });
  }

  try {
    const sheet = await getSheet(SHEET_NAMES.MESSAGES);
    const rows = await sheet.getRows();
    let deletedCount = 0;

    // Delete in reverse order to avoid index shifting issues, though google-spreadsheet handles it ok, 
    // it's safer to filter and delete sequentially.
    for (const r of rows) {
      if (r.get('chatId') === chatId) {
        await r.delete();
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      clearSheetCache(SHEET_NAMES.MESSAGES);
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
