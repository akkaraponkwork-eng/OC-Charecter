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

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  const { senderUid, action } = await req.json();
  if (!senderUid || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const currentUser = rows.find(r => r.get('uid') === uid);
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let myRequests: string[] = [];
    try {
      const existingReq = currentUser.get('friendRequests');
      if (existingReq) myRequests = JSON.parse(existingReq);
    } catch {}

    if (!myRequests.includes(senderUid)) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Remove from requests
    myRequests = myRequests.filter(id => id !== senderUid);
    currentUser.set('friendRequests', JSON.stringify(myRequests));

    if (action === 'accept') {
      const senderUser = rows.find(r => r.get('uid') === senderUid);
      if (senderUser) {
        const myFriends = getFriendsList(currentUser);
        if (!myFriends.includes(senderUid)) {
          myFriends.push(senderUid);
          currentUser.set('friends', JSON.stringify(myFriends));
        }

        const senderFriends = getFriendsList(senderUser);
        if (!senderFriends.includes(uid)) {
          senderFriends.push(uid);
          senderUser.set('friends', JSON.stringify(senderFriends));
          await senderUser.save();
        }
      }
    }

    await currentUser.save();
    clearSheetCache(SHEET_NAMES.USERS);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
