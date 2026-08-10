import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    
    const rows = await sheet.getCachedRows();
    const collabRows = await collabSheet.getCachedRows();
    
    const universesWithCollaborators = new Set(
      collabRows.filter(r => r.get('status') === 'accepted').map(r => r.get('universeId'))
    );

    const universes = rows.map((r) => ({
      id: r.get('id'),
      userId: r.get('userId'),
      name: r.get('name'),
      description: r.get('description'),
      coverUrl: r.get('coverUrl'),
      isPublic: true,
      createdAt: r.get('createdAt'),
      hasCollaborators: universesWithCollaborators.has(r.get('id')),
    }));

    return NextResponse.json(universes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
