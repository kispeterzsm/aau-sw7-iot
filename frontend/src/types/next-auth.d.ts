import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      mfa_email_enabled?: boolean | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    mfa_email_enabled?: boolean | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    mfa_email_enabled?: boolean | null;
  }
}
