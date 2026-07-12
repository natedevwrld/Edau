import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import Profile from '@/lib/models/Profile';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        await dbConnect();

        const profile = await Profile.findOne({ email: credentials.email.toLowerCase() });

        if (!profile) {
          throw new Error('User not found');
        }

        if (!profile.password) {
          throw new Error('No password set for this account');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, profile.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name || profile.email.split('@')[0] || 'User',
          role: profile.role || 'buyer',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
