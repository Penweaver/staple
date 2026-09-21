const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (so @staple/shared is hot-reloaded)
config.watchFolders = [workspaceRoot];

// 2. Resolve packages in both mobile node_modules and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Resolve TypeScript ESM imports ending in .js to .ts/.tsx
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    const nameWithoutJs = moduleName.slice(0, -3);
    try {
      return context.resolveRequest(context, nameWithoutJs, platform);
    } catch (e) {
      // Fall through to default if not matched
    }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
