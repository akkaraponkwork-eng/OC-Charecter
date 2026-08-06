import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.MESSAGES);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);
    
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const isAdmin = (session.user as any).role === 'admin';
    const chatId = row.get('chatId') || '';
    const isDmParticipant = chatId.startsWith('dm_') && chatId.includes(uid);
    
    // Allow deletion if: User is Admin OR User is the Sender OR User is a participant in this DM
    if (!isAdmin && row.get('senderId') !== uid && !isDmParticipant) {
      return NextResponse.json({ error: 'Forbidden: You cannot delete this message' }, { status: 403 });
    }

    await row.delete();
    clearSheetCache(SHEET_NAMES.MESSAGES);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
