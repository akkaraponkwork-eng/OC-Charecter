import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

// Helper to check admin
async function isAdmin(uid: string) {
  const usersSheet = await getSheet(SHEET_NAMES.USERS);
  const rows = await usersSheet.getCachedRows();
  const user = rows.find(r => r.get('uid') === uid);
  return user?.get('role') === 'admin';
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groups = await groupSheet.getCachedRows();
    const group = groups.find(r => r.get('id') === params.id);
    
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const memberIds = JSON.parse(group.get('memberIds') || '[]');
    const admin = await isAdmin(uid);
    if (!memberIds.includes(uid) && !admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Populate member details
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getCachedRows();
    const members = memberIds.map((id: string) => {
      const u = userRows.find(r => r.get('uid') === id);
      return u ? { uid: id, username: u.get('username'), displayName: u.get('displayName'), avatarUrl: u.get('avatarUrl') } : { uid: id, username: 'Unknown' };
    });

    return NextResponse.json({
      id: group.get('id'),
      name: group.get('name'),
      ownerId: group.get('ownerId'),
      members,
      createdAt: group.get('createdAt')
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 });

    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groups = await groupSheet.getCachedRows();
    const group = groups.find(r => r.get('id') === params.id);
    
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.get('ownerId') !== uid) return NextResponse.json({ error: 'Only the owner can invite members' }, { status: 403 });

    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getCachedRows();
    const targetUser = userRows.find(r => r.get('username') === username.replace('@', ''));
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const memberIds = JSON.parse(group.get('memberIds') || '[]');
    const targetUid = targetUser.get('uid');
    
    if (memberIds.includes(targetUid)) {
      return NextResponse.json({ error: 'User is already in the group' }, { status: 400 });
    }

    memberIds.push(targetUid);
    group.set('memberIds', JSON.stringify(memberIds));
    await group.save();
    clearSheetCache(SHEET_NAMES.CHAT_GROUPS);

    return NextResponse.json({ success: true, message: 'User added to group' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const { targetUid } = await req.json();
    if (!targetUid) return NextResponse.json({ error: 'targetUid is required' }, { status: 400 });

    const groupSheet = await getSheet(SHEET_NAMES.CHAT_GROUPS);
    const groups = await groupSheet.getCachedRows();
    const group = groups.find(r => r.get('id') === params.id);
    
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    
    // Only owner can kick, or user can leave
    if (group.get('ownerId') !== uid && targetUid !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const memberIds = JSON.parse(group.get('memberIds') || '[]');
    const newMemberIds = memberIds.filter((id: string) => id !== targetUid);
    
    if (newMemberIds.length === memberIds.length) {
      return NextResponse.json({ error: 'User not in group' }, { status: 400 });
    }

    group.set('memberIds', JSON.stringify(newMemberIds));
    await group.save();
    clearSheetCache(SHEET_NAMES.CHAT_GROUPS);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
