import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSheet, SHEET_NAMES, clearSheetCache } from '@/lib/google-sheets';

type Params = { params: Promise<{ id: string }> };

async function resolveIsAdmin(uid: string): Promise<boolean> {
  const usersSheet = await getSheet(SHEET_NAMES.USERS);
  const rows = await usersSheet.getCachedRows();
  const user = rows.find((r) => r.get('uid') === uid);
  return user?.get('role') === 'admin';
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;

  try {
    const sheet = await getSheet(SHEET_NAMES.MESSAGES);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);
    
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const isAdmin = await resolveIsAdmin(uid);
    const chatId = row.get('chatId') || '';
    const isPublicChat = chatId === 'public';
    const isDmParticipant = chatId.startsWith('dm_') && chatId.includes(uid);
    
    // Public chat: only admin can delete
    if (isPublicChat && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only admin can delete public chat messages' }, { status: 403 });
    }
    
    // Allow deletion if: User is Admin OR User is the Sender OR User is a participant in this DM
    if (!isAdmin && row.get('senderId') !== uid && !isDmParticipant) {
      return NextResponse.json({ error: 'Forbidden: You cannot delete this message' }, { status: 403 });
    }

    await row.delete();
    clearSheetCache(SHEET_NAMES.MESSAGES);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = (session.user as any).uid;

  try {
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const sheet = await getSheet(SHEET_NAMES.MESSAGES);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === id);

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isAdmin = await resolveIsAdmin(uid);
    const chatId = row.get('chatId') || '';
    const isPublicChat = chatId === 'public';

    // Public chat: only admin can edit
    if (isPublicChat && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only admin can edit public chat messages' }, { status: 403 });
    }

    // Non-public: only sender or admin can edit
    if (!isPublicChat && row.get('senderId') !== uid && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You cannot edit this message' }, { status: 403 });
    }

    row.set('content', content.trim());
    await row.save();
    clearSheetCache(SHEET_NAMES.MESSAGES);

    return NextResponse.json({ success: true, content: content.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

