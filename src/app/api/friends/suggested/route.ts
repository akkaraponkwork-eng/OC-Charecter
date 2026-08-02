import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

function getFriendsList(userRow: any): string[] {
  try {
    return JSON.parse(userRow.get('friends') || '[]');
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getCachedRows();
    const currentUser = rows.find(r => r.get('uid') === uid);
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const friendIds = getFriendsList(currentUser);
    
    const suggestedUsers = rows
      .filter(r => {
        const rowUid = r.get('uid');
        const role = r.get('role');
        
        // Exclude current user
        if (rowUid === uid) return false;
        
        // Exclude admins
        if (role === 'admin') return false;
        
        // Exclude existing friends
        if (friendIds.includes(rowUid)) return false;
        
        return true;
      })
      .map(r => ({
        uid: r.get('uid'),
        username: r.get('username'),
        displayName: r.get('displayName'),
        avatarUrl: r.get('avatarUrl')
      }));

    return NextResponse.json(suggestedUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
