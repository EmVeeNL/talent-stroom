// TypeScript 7 (native compiler) has no stable JS API yet. Tools that load TypeScript's
// API get their own TypeScript 6 instead of resolving the workspace's TypeScript 7 peer.
// Remove a pattern once that tool supports TypeScript 7. See docs/adr/0003-typescript-7-toolchain.md.
const TYPESCRIPT_API_VERSION = "6.0.3";
const NEEDS_TYPESCRIPT_API = [
  /^typescript-eslint$/,
  /^@typescript-eslint\//,
  /^ts-api-utils$/,
  /^@astrojs\/check$/,
  /^@astrojs\/language-server$/,
  /^@volar\//,
  /^volar-service-typescript/,
];

function readPackage(pkg) {
  if (NEEDS_TYPESCRIPT_API.some((pattern) => pattern.test(pkg.name))) {
    const declaresTypescript = pkg.peerDependencies?.typescript || pkg.dependencies?.typescript;
    if (declaresTypescript) {
      if (pkg.peerDependencies) delete pkg.peerDependencies.typescript;
      if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta.typescript;
      pkg.dependencies = { ...pkg.dependencies, typescript: TYPESCRIPT_API_VERSION };
    }
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
