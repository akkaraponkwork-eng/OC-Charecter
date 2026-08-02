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
    
    // Only allow the sender to delete their own message
    if (row.get('senderId') !== uid) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own messages' }, { status: 403 });
    }

    await row.delete();
    clearSheetCache(SHEET_NAMES.MESSAGES);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
