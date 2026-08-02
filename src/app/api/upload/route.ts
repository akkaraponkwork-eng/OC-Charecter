import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const body = new URLSearchParams();
    body.append('key', process.env.IMGBB_API_KEY!);
    body.append('image', base64);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body,
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error?.message || 'ImgBB upload failed');

    return NextResponse.json({ url: data.data.display_url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
