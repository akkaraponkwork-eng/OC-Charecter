import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getCachedRows();
    
    const users = rows
      .filter((r) => r.get('isPublic') === 'true')
      .map((r) => ({
        uid: r.get('uid'),
        displayName: r.get('displayName') || r.get('username'),
        username: r.get('username'),
        avatarUrl: r.get('avatarUrl'),
        bio: r.get('bio'),
        role: r.get('role'),
      }));

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
