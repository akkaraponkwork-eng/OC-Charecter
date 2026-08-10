require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function main() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();

  const title = 'SocialBoard';
  if (!doc.sheetsByTitle[title]) {
    await doc.addWorksheet({
      title,
      headerValues: ['id', 'senderId', 'senderName', 'senderAvatar', 'content', 'createdAt']
    });
    console.log('Created sheet:', title);
  } else {
    console.log('Sheet already exists:', title);
  }
}

main().catch(console.error);
