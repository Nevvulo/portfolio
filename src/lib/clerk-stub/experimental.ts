// TEMPORARY no-op stub for `@clerk/nextjs/experimental`.
// See ./client.tsx for context. Re-enable by removing the alias in
// next.config.mjs.

export const useSubscription = () => ({
  data: null,
  isLoaded: true,
  isLoading: false,
  error: null,
  revalidate: () => {},
});
