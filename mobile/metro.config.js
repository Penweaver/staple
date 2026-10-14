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

// 3. Force singleton React and React-DOM from mobile to prevent duplicate React instances
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

// 4. Custom resolver guaranteeing identical React 18.2.0 singleton across all files
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    const sub = moduleName === 'react' ? 'index.js' : moduleName.slice('react/'.length);
    return context.resolveRequest(context, path.resolve(projectRoot, 'node_modules/react', sub), platform);
  }
  if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
    const sub = moduleName === 'react-dom' ? 'index.js' : moduleName.slice('react-dom/'.length);
    return context.resolveRequest(context, path.resolve(projectRoot, 'node_modules/react-dom', sub), platform);
  }
  if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
    const sub = moduleName === 'react-native' ? 'index.js' : moduleName.slice('react-native/'.length);
    return context.resolveRequest(context, path.resolve(projectRoot, 'node_modules/react-native', sub), platform);
  }

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
