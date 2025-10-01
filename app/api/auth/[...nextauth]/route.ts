import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { env, authProviders } from '@/lib/env';

// Create Prisma client
const prisma = new PrismaClient();

// NextAuth configuration
const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  // Configure providers
  providers: [
    // Google OAuth Provider
    ...(authProviders.google.clientId && authProviders.google.clientSecret ? [
      GoogleProvider({
        clientId: authProviders.google.clientId,
        clientSecret: authProviders.google.clientSecret,
        authorization: {
          params: {
            prompt: 'consent',
            access_type: 'offline',
            response_type: 'code',
          },
        },
      })
    ] : []),

    // GitHub OAuth Provider
    ...(authProviders.github.clientId && authProviders.github.clientSecret ? [
      GitHubProvider({
        clientId: authProviders.github.clientId,
        clientSecret: authProviders.github.clientSecret,
        authorization: {
          params: {
            scope: 'read:user user:email',
          },
        },
      })
    ] : []),

    // Credentials Provider (Email/Password)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn('Missing credentials for authentication attempt');
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            logger.warn('User not found for authentication attempt', {
              email: credentials.email,
            });
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            logger.warn('Inactive user attempted authentication', {
              userId: user.id,
              email: credentials.email,
            });
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password || ''
          );

          if (!isValidPassword) {
            logger.warn('Invalid password for authentication attempt', {
              userId: user.id,
              email: credentials.email,
            });
            return null;
          }

          // Record successful authentication
          monitoring.recordCounter('auth.credentials.success', 1, {
            userId: user.id,
          });

          logger.info('User authenticated successfully', {
            userId: user.id,
            email: user.email,
            method: 'credentials',
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
          };
        } catch (error) {
          logger.error('Authentication error', {
            error: error instanceof Error ? error.message : String(error),
            email: credentials.email,
          });
          return null;
        }
      },
    }),
  ],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Pages configuration
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },

  // Callbacks
  callbacks: {
    // JWT callback
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        logger.info('JWT token created', {
          userId: user.id,
          provider: account.provider,
        });

        // Record authentication metric
        monitoring.recordCounter('auth.jwt.created', 1, {
          provider: account.provider,
        });

        return {
          ...token,
          id: user.id,
          role: user.role,
          provider: account.provider,
        };
      }

      // Return previous token if the access token has not expired yet
      return token;
    },

    // Session callback
    async session({ session, token }) {
      if (token) {
        // Get fresh user data from database
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              role: true,
              isActive: true,
              emailVerified: true,
            },
          });

          if (user && user.isActive) {
            session.user = {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.avatar,
              role: user.role,
            };

            // Record session access
            monitoring.recordCounter('auth.session.accessed', 1, {
              userId: user.id,
            });

            logger.debug('Session accessed', {
              userId: user.id,
              email: user.email,
            });
          } else {
            logger.warn('Session access denied - user not found or inactive', {
              userId: token.id,
            });
            return session;
          }
        } catch (error) {
          logger.error('Session callback error', {
            error: error instanceof Error ? error.message : String(error),
            userId: token.id,
          });
          return session;
        }
      }

      return session;
    },

    // Sign in callback
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Record sign in attempt
        monitoring.recordCounter('auth.signin.attempt', 1, {
          provider: account?.provider || 'credentials',
        });

        // For OAuth providers, check if user exists or create them
        if (account?.provider && account.provider !== 'credentials') {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                avatar: user.image,
                emailVerified: new Date(),
                isActive: true,
                role: UserRole.CUSTOMER,
              },
            });

            logger.info('New user created via OAuth', {
              userId: newUser.id,
              email: newUser.email,
              provider: account.provider,
            });

            monitoring.recordCounter('auth.user.created', 1, {
              provider: account.provider,
            });
          } else {
            // Update existing user with OAuth info
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                avatar: user.image || existingUser.avatar,
              },
            });

            logger.info('Existing user signed in via OAuth', {
              userId: existingUser.id,
              email: existingUser.email,
              provider: account.provider,
            });
          }
        }

        // Record successful sign in
        monitoring.recordCounter('auth.signin.success', 1, {
          provider: account?.provider || 'credentials',
        });

        return true;
      } catch (error) {
        logger.error('Sign in callback error', {
          error: error instanceof Error ? error.message : String(error),
          email: user.email,
          provider: account?.provider,
        });

        monitoring.recordCounter('auth.signin.error', 1, {
          provider: account?.provider || 'credentials',
        });

        return false;
      }
    },

    // Redirect callback
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Events
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info('User signed in', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
      });

      monitoring.recordCounter('auth.signin.event', 1, {
        provider: account?.provider || 'credentials',
        isNewUser: isNewUser ? 'true' : 'false',
      });
    },

    async signOut({ token }) {
      logger.info('User signed out', {
        userId: token?.id,
        email: token?.email,
      });

      monitoring.recordCounter('auth.signout.event', 1);
    },

    async createUser({ user }) {
      logger.info('User created', {
        userId: user.id,
        email: user.email,
      });

      monitoring.recordCounter('auth.user.created.event', 1);
    },

    async updateUser({ user }) {
      logger.info('User updated', {
        userId: user.id,
        email: user.email,
      });

      monitoring.recordCounter('auth.user.updated.event', 1);
    },

    async linkAccount({ user, account, profile }) {
      logger.info('Account linked', {
        userId: user.id,
        provider: account.provider,
      });

      monitoring.recordCounter('auth.account.linked', 1, {
        provider: account.provider,
      });
    },

  },

  // Debug mode
  debug: process.env.NODE_ENV === 'development',

  // Secret
  secret: env.NEXTAUTH_SECRET,
};

// Create NextAuth handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };