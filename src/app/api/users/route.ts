import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const myUid = (session.user as any).uid;
  const isAdmin = (session.user as any).role === 'admin';

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getCachedRows();
    
    const users = rows
      .filter((r) => {
        if (isAdmin || r.get('uid') === myUid) return true;
        return String(r.get('isPublic')).toLowerCase() !== 'false';
      })
      .map((r) => {
        const realRole = r.get('role');
        const displayRole = (isAdmin || r.get('uid') === myUid) ? realRole : (realRole === 'admin' ? 'user' : realRole);
        
        let socialLinks = null;
        try {
          if (r.get('socialLinks')) {
            socialLinks = JSON.parse(r.get('socialLinks'));
          }
        } catch(e) {}
        
        return {
          uid: r.get('uid'),
          displayName: r.get('displayName') || r.get('username'),
          username: r.get('username'),
          avatarUrl: r.get('avatarUrl'),
          bio: r.get('bio'),
          socialLinks,
          role: displayRole,
          lastActiveAt: r.get('lastActiveAt') || null,
        };
      });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
