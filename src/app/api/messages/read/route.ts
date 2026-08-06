import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const uid = (session.user as any).uid;
  const { chatId } = await req.json();
  if (!chatId) return NextResponse.json({ error: 'chatId required' }, { status: 400 });

  try {
    const sheet = await getSheet(SHEET_NAMES.MESSAGES);
    const rows = await sheet.getRows();
    let updated = false;

    for (const r of rows) {
      if (r.get('chatId') === chatId && r.get('senderId') !== uid) {
        let readBy: string[] = [];
        try {
          readBy = JSON.parse(r.get('readBy') || '[]');
        } catch (e) {
          readBy = [];
        }

        if (!readBy.includes(uid)) {
          readBy.push(uid);
          r.set('readBy', JSON.stringify(readBy));
          await r.save();
          updated = true;
        }
      }
    }

    if (updated) {
      clearSheetCache(SHEET_NAMES.MESSAGES);
    }

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
