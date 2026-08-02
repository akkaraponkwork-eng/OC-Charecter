import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const user = rows.find((r) => r.get('uid') === uid);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      uid: user.get('uid'), email: user.get('email'), username: user.get('username'),
      displayName: user.get('displayName'), avatarUrl: user.get('avatarUrl'),
      bio: user.get('bio'), role: user.get('role'),
      socialLinks: (() => { try { return JSON.parse(user.get('socialLinks') || '{}'); } catch { return {}; } })(),
      isPublic: user.get('isPublic') === 'true', createdAt: user.get('createdAt'),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;
  const body = await req.json();

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const user = rows.find((r) => r.get('uid') === uid);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (body.displayName !== undefined) user.set('displayName', body.displayName);
    if (body.bio !== undefined) user.set('bio', body.bio);
    if (body.avatarUrl !== undefined) user.set('avatarUrl', body.avatarUrl);
    if (body.socialLinks !== undefined) user.set('socialLinks', JSON.stringify(body.socialLinks));
    if (body.isPublic !== undefined) user.set('isPublic', String(body.isPublic));
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const uid = (session.user as any).uid;

  try {
    const usersSheet = await getSheet(SHEET_NAMES.USERS);
    const uRows = await usersSheet.getRows();
    const uRow = uRows.find((r) => r.get('uid') === uid);
    if (uRow) await uRow.delete();

    // Cascade: delete characters
    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const cRows = await charSheet.getRows();
    for (const r of cRows.filter((r) => r.get('userId') === uid)) await r.delete();

    // Cascade: delete universes and collect their IDs
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getRows();
    const deletedUniIds: string[] = [];
    for (const r of uniRows) {
      if (r.get('userId') === uid) {
        deletedUniIds.push(r.get('id'));
        await r.delete();
      }
    }

    // Cascade: delete collaborations
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getRows();
    for (const r of collabRows) {
      if (r.get('userId') === uid || deletedUniIds.includes(r.get('universeId'))) {
        await r.delete();
      }
    }

    // Cascade: delete messages
    const msgSheet = await getSheet(SHEET_NAMES.MESSAGES);
    const msgRows = await msgSheet.getRows();
    for (const r of msgRows) {
      if (r.get('senderId') === uid || deletedUniIds.includes(r.get('universeId'))) {
        await r.delete();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
