import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const universeSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uRows = await universeSheet.getCachedRows();
    const universe = uRows.find(r => r.get('id') === token);
    if (!universe) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    return NextResponse.json({ name: universe.get('name') });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { token } = await params;
  try {
    const universeSheet = await getSheet(SHEET_NAMES.UNIVERSES);
    const uRows = await universeSheet.getRows();
    const universe = uRows.find(r => r.get('id') === token);
    if (!universe) return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    
    // Check if user is already the owner
    const uid = (session.user as any).uid;
    if (universe.get('userId') === uid) {
      return NextResponse.json({ error: 'You are the owner' }, { status: 400 });
    }
    
    const collabSheet = await getSheet(SHEET_NAMES.COLLABORATIONS);
    const cRows = await collabSheet.getRows();
    
    // Check if already collaborator
    const existingCollab = cRows.find(r => r.get('universeId') === token && r.get('userId') === uid);
    if (existingCollab) {
      if (existingCollab.get('status') !== 'accepted') {
        existingCollab.set('status', 'accepted');
        await existingCollab.save();
        clearSheetCache(SHEET_NAMES.COLLABORATIONS);
      }
      return NextResponse.json({ success: true, message: 'Already a collaborator' });
    }
    
    await collabSheet.addRow({
      id: `${token}_${uid}`,
      universeId: token,
      userId: uid,
      status: 'accepted',
      joinedAt: new Date().toISOString()
    });
    
    clearSheetCache(SHEET_NAMES.COLLABORATIONS);
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
