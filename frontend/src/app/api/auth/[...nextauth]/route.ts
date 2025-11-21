import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Call your backend login API
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/login`,
            {
              method: "POST",
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
              headers: { "Content-Type": "application/json" },
            }
          );

          // Handle different response statuses
          // Handle different response statuses
          if (res.status === 404) {
            // Return null with specific error
            return Promise.reject(new Error("User not found - No account exists with this email"));
          } else if (res.status === 401) {
            // Return null with specific error  
            return Promise.reject(new Error("Invalid credentials - The email or password you entered is incorrect"));
          } else if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return Promise.reject(new Error(errorData.message || "Login failed - Please try again"));
          }

          const user = await res.json();

          if (user) {
            // Return user object that will be stored in JWT
            return {
              id: user.id?.toString() || user.email,
              email: user.email,
            };
          }
          return null;
        } catch (error: any) {
          console.error("Auth error:", error);
          // Return null with error message
          return Promise.reject(new Error(error.message || "Authentication failed - Please try again"));
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };