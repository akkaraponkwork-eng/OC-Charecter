import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;
  const { action } = await req.json(); // 'accept' | 'decline'

  try {
    const sheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const rows = await sheet.getCachedRows();
    const row = rows.find((r) => r.get('id') === id && r.get('userId') === uid);
    if (!row) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

    row.set('status', action === 'accept' ? 'accepted' : 'declined');
    await row.save();

    return NextResponse.json({ success: true, status: row.get('status') });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
