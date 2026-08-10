import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getCachedRows();
    const userRow = rows.find(r => r.get('uid') === uid);
    
    if (userRow) {
      userRow.set('lastActiveAt', new Date().toISOString());
      await userRow.save();
      clearSheetCache(SHEET_NAMES.USERS);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
