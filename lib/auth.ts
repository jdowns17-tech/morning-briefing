import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export type AppSession = Session & {
  accessToken?: string;
  error?: "RefreshTokenMissing" | "RefreshTokenError";
};

type AppToken = JWT & {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: "RefreshTokenMissing" | "RefreshTokenError";
};

async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const tokens = await response.json();
  if (!response.ok) throw new Error(tokens.error ?? "refresh_failed");

  return {
    accessToken: tokens.access_token as string,
    expiresAt: Math.floor(Date.now() / 1000) + (tokens.expires_in as number),
    // Google only returns a new refresh_token occasionally; keep the old one otherwise.
    refreshToken: (tokens.refresh_token as string | undefined) ?? refreshToken,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: `openid email profile ${GMAIL_READONLY_SCOPE}`,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      const appToken = token as AppToken;

      if (account) {
        appToken.accessToken = account.access_token;
        appToken.refreshToken = account.refresh_token;
        appToken.expiresAt = account.expires_at;
        delete appToken.error;
        return appToken;
      }

      const isStillValid =
        typeof appToken.expiresAt === "number" &&
        Date.now() < appToken.expiresAt * 1000 - 60_000;
      if (isStillValid) return appToken;

      if (!appToken.refreshToken) {
        appToken.error = "RefreshTokenMissing";
        return appToken;
      }

      try {
        const refreshed = await refreshGoogleAccessToken(appToken.refreshToken);
        appToken.accessToken = refreshed.accessToken;
        appToken.expiresAt = refreshed.expiresAt;
        appToken.refreshToken = refreshed.refreshToken;
        delete appToken.error;
      } catch {
        appToken.error = "RefreshTokenError";
      }

      return appToken;
    },
    async session({ session, token }) {
      const appSession = session as AppSession;
      const appToken = token as AppToken;
      appSession.accessToken = appToken.accessToken;
      appSession.error = appToken.error;
      return appSession;
    },
  },
});

export async function getSession(): Promise<AppSession | null> {
  const session = await auth();
  return session as AppSession | null;
}
