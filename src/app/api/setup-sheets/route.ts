import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SHEET_SCHEMAS = [
  {
    title: 'Users',
    headers: ['uid','email','username','displayName','passwordHash','avatarUrl','bio','socialLinks','isPublic','role','createdAt'],
  },
  {
    title: 'Universes',
    headers: ['id','userId','name','description','coverUrl','isPublic','createdAt'],
  },
  {
    title: 'Characters',
    headers: ['id','userId','universeId','name','statsJSON','tags','imageUrl','bio','isPublic','createdAt'],
  },
  {
    title: 'Collaborations',
    headers: ['id','universeId','invitedBy','userId','invitedEmail','role','status','createdAt'],
  },
  {
    title: 'Messages',
    headers: ['id','chatId','senderId','senderName','senderAvatar','content','createdAt'],
  },
  {
    title: 'ChatGroups',
    headers: ['id','name','ownerId','memberIds','coverUrl','createdAt'],
  },
];

export async function POST() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();

    const results: string[] = [];

    for (const schema of SHEET_SCHEMAS) {
      let sheet = doc.sheetsByTitle[schema.title];
      if (!sheet) {
        sheet = await doc.addSheet({ title: schema.title, headerValues: schema.headers });
        results.push(`Created: ${schema.title}`);
      } else {
        await sheet.setHeaderRow(schema.headers);
        results.push(`Updated Headers: ${schema.title}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
