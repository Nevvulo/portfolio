// Clerk configuration for GitHub OAuth
// This ensures we request the correct scopes for commenting on discussions

export const clerkConfig = {
  // GitHub OAuth scopes needed for discussions
  socialProviders: {
    github: {
      scopes: [
        "public_repo", // Access to public repositories
        "write:discussion", // Write access to discussions
        "read:discussion", // Read access to discussions
      ],
    },
  },
};
