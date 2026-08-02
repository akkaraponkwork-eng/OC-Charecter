import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { hashPassword } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

// GET all users (admin only)
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const users = rows.map((r) => ({
      uid: r.get('uid'), email: r.get('email'), username: r.get('username'),
      displayName: r.get('displayName'), avatarUrl: r.get('avatarUrl'),
      role: r.get('role'), createdAt: r.get('createdAt'),
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
    const sheet = await getSheet(SHEET_NAMES.USERS);
    const rows = await sheet.getRows();
    const user = rows.find((r) => r.get('uid') === uid);
    if (user) await user.delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
