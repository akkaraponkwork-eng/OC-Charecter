import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let docInstance: GoogleSpreadsheet | null = null;

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (docInstance) return docInstance;

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);
  await doc.loadInfo();
  docInstance = doc;
  return doc;
}

const rowsCache = new Map<string, { time: number, data: any }>();

export function clearSheetCache(title: string) {
  rowsCache.delete(title);
}

export async function getSheet(title: string): Promise<GoogleSpreadsheetWorksheet & { getCachedRows: () => Promise<any[]> }> {
  const doc = await getDoc();
  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    if (title === 'SocialBoard') {
      sheet = await doc.addSheet({ title, headerValues: ['id', 'chatId', 'senderId', 'senderName', 'senderAvatar', 'content', 'readBy', 'createdAt'] });
    } else {
      throw new Error(`Sheet "${title}" not found`);
    }
  }
  
  // Attach a cached getRows method to avoid 429 errors
  const getCachedRows = async () => {
    const now = Date.now();
    const cached = rowsCache.get(title);
    if (cached && (now - cached.time < 10000)) { // 10 second cache
      return cached.data;
    }
    const rows = await sheet.getRows();
    rowsCache.set(title, { time: now, data: rows });
    return rows;
  };

  return Object.assign(sheet, { getCachedRows });
}

export const SHEET_NAMES = {
  USERS: 'Users',
  UNIVERSES: 'Universes',
  CHARACTERS: 'Characters',
  COLLABORATIONS: 'Collaborations',
  MESSAGES: 'Messages',
  CHAT_GROUPS: 'ChatGroups',
  NOTIFICATIONS: 'Notifications',
  SOCIAL_BOARD: 'SocialBoard',
} as const;

export type SheetName = typeof SHEET_NAMES[keyof typeof SHEET_NAMES];
