import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role, BranchLocation } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@test.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("LOGIN ATTEMPT:", (credentials as any)?.username, credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.error("🔥 AUTH ERROR: User not found for email:", credentials.email);
            throw new Error("Invalid credentials");
          }

          // Proper bcrypt comparison for hashed passwords
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            console.error("🔥 AUTH ERROR: Password mismatch for email:", credentials.email);
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branch: user.branch,
          };
        } catch (error) {
          console.error("🔥 AUTH PRISMA ERROR:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.branch = user.branch;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.branch = token.branch as BranchLocation;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Route to our custom login page
  },
  secret: process.env.NEXTAUTH_SECRET,
};
