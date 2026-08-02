import bcrypt from 'bcryptjs';
import { auth } from '@/auth';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if ((session.user as any).role !== 'admin') throw new Error('Forbidden: Admin only');
  return session;
}

export function generateDmChatId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}
