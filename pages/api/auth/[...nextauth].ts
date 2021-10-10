import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export default (req, res) =>
  NextAuth(req, res, {
    providers: [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        authorization:
          "https://github.com/login/oauth/authorize?scope=read%3Auser%20user%3Aemail%20public_repo&client_id=66f5a7dccea02921dc2b&response_type=code&redirect_uri=https%3A%2F%2Fnevulo.xyz%2Fapi%2Fauth%2Fcallback%2Fgithub&state=532ff498fc279a35c30175832c7c9249a1f16b3cc63831d53699ee33749c3758",
      } as any),
    ],
    debug: process.env.NODE_ENV === "development",
    secret: process.env.AUTH_SECRET,
    jwt: { secret: process.env.JWT_SECRET },
    session: { jwt: true },
    callbacks: {
      async redirect({ url, baseUrl }) {
        return "/blog";
      },
      async jwt({ token, account }) {
        // Persist the OAuth access_token to the token right after signin
        if (account) {
          token.accessToken = account.access_token;
        }
        return token;
      },
      async session({ session, token }) {
        // Send properties to the client, like an access_token from a provider.
        session.accessToken = token.accessToken;
        return session;
      },
    },
  });
