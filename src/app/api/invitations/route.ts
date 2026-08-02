import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const usersSheet = await getSheet(SHEET_NAMES.USERS);

    const rows = await sheet.getCachedRows();
    const uniRows = await uniSheet.getCachedRows();
    const userRows = await usersSheet.getCachedRows();

    const invitations = rows
      .filter((r) => r.get('userId') === uid && r.get('status') === 'pending')
      .map((r) => {
        const uni = uniRows.find((u) => u.get('id') === r.get('universeId'));
        const inviter = userRows.find((u) => u.get('uid') === r.get('invitedBy'));
        return {
          id: r.get('id'),
          universeId: r.get('universeId'),
          universeName: uni?.get('name') || 'Unknown Universe',
          inviterName: inviter?.get('displayName') || inviter?.get('username') || 'Unknown',
          inviterAvatar: inviter?.get('avatarUrl') || '',
          createdAt: r.get('createdAt'),
        };
      });

    return NextResponse.json(invitations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
