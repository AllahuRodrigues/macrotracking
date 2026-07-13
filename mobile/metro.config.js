// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the repo root so we can import the shared logic in ../src/lib
config.watchFolders = [workspaceRoot];

// Resolve modules from the mobile app first, then the repo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Map @shared/* to the web app's shared lib so types + logic never drift.
config.resolver.extraNodeModules = {
  "@shared": path.resolve(workspaceRoot, "src/lib"),
};

module.exports = config;
