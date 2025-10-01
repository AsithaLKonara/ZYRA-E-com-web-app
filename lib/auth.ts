import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Mock user validation
        const users = [
          {
            id: "1",
            email: "admin@example.com",
            password: "admin123",
            name: "Admin User",
            role: "admin"
          },
          {
            id: "2",
            email: "test@example.com",
            password: "password123",
            name: "Test User",
            role: "user"
          },
          {
            id: "3",
            email: "testuser@example.com",
            password: "password123",
            name: "Test User 2",
            role: "user"
          }
        ]

        const user = users.find(
          u => u.email === credentials.email && u.password === credentials.password
        )

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role || 'customer'
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  }
}