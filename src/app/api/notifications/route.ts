import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.NOTIFICATIONS);
    const rows = await sheet.getCachedRows();
    
    // Sort by createdAt descending
    const notifications = rows
      .filter(r => r.get('userId') === uid)
      .map(r => ({
        id: r.get('id'),
        type: r.get('type'),
        title: r.get('title'),
        content: r.get('content'),
        link: r.get('link'),
        read: r.get('read') === 'true',
        createdAt: r.get('createdAt'),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.NOTIFICATIONS);
    const rows = await sheet.getRows(); // get actual rows to save
    let updated = false;

    for (const r of rows) {
      if (r.get('userId') === uid && r.get('read') !== 'true') {
        r.set('read', 'true');
        await r.save();
        updated = true;
      }
    }

    if (updated) {
      clearSheetCache(SHEET_NAMES.NOTIFICATIONS);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
