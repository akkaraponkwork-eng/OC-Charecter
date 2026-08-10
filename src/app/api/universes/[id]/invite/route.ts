import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const rows = await sheet.getCachedRows();
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getCachedRows();

    const collabs = rows
      .filter((r) => r.get('universeId') === id && r.get('status') === 'accepted')
      .map((r) => {
        const user = userRows.find((u) => u.get('uid') === r.get('userId'));
        return {
          id: r.get('id'),
          userId: r.get('userId'),
          displayName: user?.get('displayName') || user?.get('username') || 'Unknown',
          avatarUrl: user?.get('avatarUrl') || '',
          role: r.get('role'),
        };
      });

    return NextResponse.json(collabs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/universes/[id]/invite
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const body = await req.json();
  const query = body.username || body.email;
  if (!query) return NextResponse.json({ error: 'Username or email required' }, { status: 400 });

  try {
    // Verify user owns universe
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getRows();
    const universe = uniRows.find((r) => r.get('id') === id);
    if (!universe) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    if (universe.get('userId') !== uid)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Find invitee by username or email
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getRows();
    const invitee = userRows.find(
      (r) => r.get('username') === query.replace('@', '') || r.get('email') === query
    );
    if (!invitee) return NextResponse.json({ error: 'ไม่พบผู้ใช้งานนี้' }, { status: 404 });
    if (invitee.get('uid') === uid)
      return NextResponse.json({ error: 'ไม่สามารถเชิญตัวเองได้' }, { status: 400 });

    // Check duplicate
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getRows();
    const exists = collabRows.find(
      (r) => r.get('universeId') === id && r.get('userId') === invitee.get('uid') && r.get('status') !== 'declined'
    );
    if (exists) return NextResponse.json({ error: 'เชิญผู้ใช้นี้ไปแล้ว' }, { status: 409 });

    await collabSheet.addRow({
      id: uuidv4(),
      universeId: id,
      invitedBy: uid,
      userId: invitee.get('uid'),
      invitedEmail: invitee.get('email'),
      role: 'editor',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      inviteeName: invitee.get('displayName') || invitee.get('username'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// DELETE — remove collaborator
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;
  const { userId } = await req.json();

  try {
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getRows();
    const universe = uniRows.find((r) => r.get('id') === id);
    if (!universe) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    
    const isOwner = universe.get('userId') === uid;
    if (!isOwner && uid !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getRows();
    const row = collabRows.find(
      (r) => r.get('universeId') === id && r.get('userId') === userId
    );
    if (row) {
      await row.delete();
      clearSheetCache(SHEET_NAMES.COLLABORATIONS);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
