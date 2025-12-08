import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          const backendUrl = "http://127.0.0.1:8999";

          const res = await fetch(`${backendUrl}/login`, {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { "Content-Type": "application/json" },
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Authentication failed");
          }

          if (data && data.user && data.user.mfa_email_enabled) {
            if (credentials.otp) {
              const verifyRes = await fetch(
                `${backendUrl}/mfa/email/verify?user_id=${data.user.id}&code=${credentials.otp}`,
                {
                  method: "POST",
                }
              );

              if (!verifyRes.ok) {
                throw new Error("Invalid OTP code");
              }

              return {
                id: data.user.id?.toString(),
                email: data.user.email,
                mfa_email_enabled: true,
              };
            } else {
              await fetch(
                `${backendUrl}/mfa/email/request?user_id=${data.user.id}`,
                {
                  method: "POST",
                }
              );

              throw new Error("MFA_REQUIRED");
            }
          }

          if (data && data.user) {
            return {
              id: data.user.id?.toString(),
              email: data.user.email,
              mfa_email_enabled: false,
            };
          }

          return null;
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message);
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.mfa_email_enabled = user.mfa_email_enabled;
      }
      if (trigger === "update" && session?.mfa_email_enabled !== undefined) {
        token.mfa_email_enabled = session.mfa_email_enabled;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.mfa_email_enabled = token.mfa_email_enabled as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
