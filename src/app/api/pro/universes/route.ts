import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role?.toLowerCase();
  if (role !== 'pro' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const rows = await sheet.getCachedRows();

    const universes = rows.map((r) => ({
      id: r.get('id'),
      userId: r.get('userId'),
      name: r.get('name'),
      description: r.get('description'),
      coverUrl: r.get('coverUrl'),
      isPublic: true,
      createdAt: r.get('createdAt'),
    }));

    return NextResponse.json(universes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
