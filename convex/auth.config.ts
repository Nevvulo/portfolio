export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL || "https://witty-moray-35.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
