import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';
import { hashPassword } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

// GET all users (admin only)
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getCachedRows();
    const users = rows.map((r) => ({
      uid: r.get('uid'), email: r.get('email'), username: r.get('username'),
      displayName: r.get('displayName'), avatarUrl: r.get('avatarUrl'),
      role: r.get('role'), createdAt: r.get('createdAt'),
      bio: r.get('bio'), socialLinks: r.get('socialLinks'), isPublic: r.get('isPublic'),
    }));
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create user (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { username, email, password, role } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'username and password required' }, { status: 400 });

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    if (rows.find((r) => r.get('username') === username))
      return NextResponse.json({ error: 'Username taken' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    await sheet.addRow({
      uid: uuidv4(), email: email || '', username,
      displayName: username, passwordHash, avatarUrl: '',
      bio: '', socialLinks: '{}', isPublic: 'true',
      role: role || 'user', createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update role (admin only)
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { uid, role, resetPassword } = await req.json();
  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const user = rows.find((r) => r.get('uid') === uid);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (resetPassword) {
      const passwordHash = await hashPassword(resetPassword);
      user.set('passwordHash', passwordHash);
    }

    if (role) {
      user.set('role', role);
    }

    await user.save();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE user (admin only)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { uid } = await req.json();
  try {
    // 1. Delete characters
    const charSheet = await getSheet(SHEET_NAMES.CHARACTERS);
    const charRows = await charSheet.getRows();
    for (const r of charRows) {
      if (r.get('userId') === uid) await r.delete();
    }

    // 2. Delete universes and collect their IDs
    const uniSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uniRows = await uniSheet.getRows();
    const deletedUniIds: string[] = [];
    for (const r of uniRows) {
      if (r.get('userId') === uid) {
        deletedUniIds.push(r.get('id'));
        await r.delete();
      }
    }

    // 3. Delete collaborations (where user is member OR universe is deleted)
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const collabRows = await collabSheet.getRows();
    for (const r of collabRows) {
      if (r.get('userId') === uid || deletedUniIds.includes(r.get('universeId'))) {
        await r.delete();
      }
    }

    // 4. Delete messages sent by user or in their deleted universes
    const msgSheet = await getSheet(SHEET_NAMES.MESSAGES);
    const msgRows = await msgSheet.getRows();
    for (const r of msgRows) {
      if (r.get('senderId') === uid || deletedUniIds.includes(r.get('universeId'))) {
        await r.delete();
      }
    }

    // 5. Delete the user
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const user = rows.find((r) => r.get('uid') === uid);
    if (user) await user.delete();

    // Clear all caches since this affects everything
    clearSheetCache(SHEET_NAMES.CHARACTERS);
    clearSheetCache(SHEET_NAMES.UNIVERSES);
    clearSheetCache(SHEET_NAMES.COLLABORATIONS);
    clearSheetCache(SHEET_NAMES.MESSAGES);
    clearSheetCache(SHEET_NAMES.USERS);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
