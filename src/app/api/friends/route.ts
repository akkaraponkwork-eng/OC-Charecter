import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

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
    const friends = rows
      .filter(r => friendIds.includes(r.get('uid')))
      .map(r => ({
        uid: r.get('uid'),
        username: r.get('username'),
        displayName: r.get('displayName'),
        avatarUrl: r.get('avatarUrl'),
        bio: r.get('bio'),
        isPublic: r.get('isPublic') === 'true'
      }));

    return NextResponse.json(friends);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const currentUser = rows.find(r => r.get('uid') === uid);
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = rows.find(r => r.get('username') === username);
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.get('uid') === uid) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });

    const friendIds = getFriendsList(currentUser);
    if (friendIds.includes(targetUser.get('uid'))) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 });
    }

    // Ensure friendRequests column exists
    if (!sheet.headerValues.includes('friendRequests')) {
      await sheet.setHeaderRow([...sheet.headerValues, 'friendRequests']);
    }

    let targetRequests = [];
    try {
      const existingReq = targetUser.get('friendRequests');
      if (existingReq) targetRequests = JSON.parse(existingReq);
    } catch {}

    if (targetRequests.includes(uid)) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
    }

    targetRequests.push(uid);
    targetUser.set('friendRequests', JSON.stringify(targetRequests));
    await targetUser.save();
    clearSheetCache(SHEET_NAMES.USERS);

    return NextResponse.json({ success: true, friend: {
      uid: targetUser.get('uid'),
      username: targetUser.get('username'),
      displayName: targetUser.get('displayName'),
      avatarUrl: targetUser.get('avatarUrl'),
      bio: targetUser.get('bio'),
      isPublic: targetUser.get('isPublic') === 'true'
    } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  const url = new URL(req.url);
  const friendId = url.searchParams.get('friendId');
  if (!friendId) return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const currentUser = rows.find(r => r.get('uid') === uid);
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const friendIds = getFriendsList(currentUser);
    const newFriendIds = friendIds.filter(id => id !== friendId);
    
    currentUser.set('friends', JSON.stringify(newFriendIds));
    await currentUser.save();
    clearSheetCache(SHEET_NAMES.USERS);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
