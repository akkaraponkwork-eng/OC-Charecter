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
    const rows = await sheet.getRows();
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getRows();

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
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  try {
    // Verify user owns universe
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getRows();
    const universe = uniRows.find((r) => r.get('id') === id);
    if (!universe) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    if (universe.get('userId') !== uid)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Find invitee
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const userRows = await usersSheet.getRows();
    const invitee = userRows.find((r) => r.get('email') === email);
    if (!invitee) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (invitee.get('uid') === uid)
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });

    // Check duplicate
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getRows();
    const exists = collabRows.find(
      (r) => r.get('universeId') === id && r.get('invitedEmail') === email && r.get('status') !== 'declined'
    );
    if (exists) return NextResponse.json({ error: 'Already invited' }, { status: 409 });

    await collabSheet.addRow({
      id: uuidv4(),
      universeId: id,
      invitedBy: uid,
      userId: invitee.get('uid'),
      invitedEmail: email,
      role: 'editor',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
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
