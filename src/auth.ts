import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSheet, SHEET_NAMES } from '@/lib/google-sheets';
import { comparePassword } from '@/lib/auth-helpers';
import { v4 as uuidv4 } from 'uuid';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const sheet = await getSheet(SHEET_NAMES.USERS);
        const rows = await sheet.getRows();
        const user = rows.find((r) => r.get('username') === credentials.username);

        if (!user) return null;
        if (user.get('role') === 'banned') throw new Error('Banned');

        const valid = await comparePassword(
          credentials.password as string,
          user.get('passwordHash')
        );
        if (!valid) return null;

        return {
          id: user.get('uid'),
          email: user.get('email'),
          name: user.get('displayName') || user.get('username'),
          image: user.get('avatarUrl') || null,
          role: user.get('role'),
          username: user.get('username'),
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Google OAuth — sync user to Sheets on first login
      if (account?.provider === 'google') {
        try {
          const sheet = await getSheet(SHEET_NAMES.USERS);
          const rows = await sheet.getRows();
          const existing = rows.find((r) => r.get('email') === user.email);

          if (!existing) {
            await sheet.addRow({
              uid: uuidv4(),
              email: user.email ?? '',
              username: user.email?.split('@')[0] ?? uuidv4(),
              displayName: user.name ?? '',
              passwordHash: '',
              avatarUrl: user.image ?? '',
              bio: '',
              socialLinks: JSON.stringify({ twitter: '', instagram: '' }),
              isPublic: 'true',
              role: 'user',
              createdAt: new Date().toISOString(),
            });
          } else if (existing.get('role') === 'banned') {
            return false;
          }
        } catch (e) {
          console.error('Error syncing user to Sheets:', e);
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update' && session) {
        if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl;
        if (session.name !== undefined) token.username = session.name;
        if (session.name !== undefined) token.name = session.name;
        return token;
      }

      if (user) {
        // On sign-in: fetch role + uid from Sheets
        try {
          const sheet = await getSheet(SHEET_NAMES.USERS);
          const rows = await sheet.getRows();
          const dbUser = rows.find(
            (r) => {
              const emailMatch = (user.email || token.email) && r.get('email')?.toLowerCase() === (user.email || token.email)?.toLowerCase();
              const uidMatch = user.id && r.get('uid') === user.id;
              return emailMatch || uidMatch;
            }
          );
          if (dbUser) {
            token.uid = dbUser.get('uid');
            token.role = dbUser.get('role');
            token.username = dbUser.get('username');
            token.avatarUrl = dbUser.get('avatarUrl');
          }
        } catch (e) {
          console.error('JWT callback error:', e);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).uid = token.uid;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
    error: '/',
  },

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});
