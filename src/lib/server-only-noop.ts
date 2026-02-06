// Noop replacement for the "server-only" package.
// Turbopack's resolveAlias applies globally (no isServer check), so this
// prevents build errors when @clerk/nextjs internal modules are traced
// through Pages Router bundles. The actual server/client boundary is
// enforced by Next.js "use server" directives, not this package.
