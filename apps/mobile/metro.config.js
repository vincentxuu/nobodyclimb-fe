const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

// Find the project and workspace directories
const projectRoot = __dirname
// This can be replaced with `require.resolve('nobodyclimb/package.json')` or similar
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot]

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// 3. Disable package exports for resolution (sometimes needed for monorepos)
config.resolver.unstable_enablePackageExports = true

module.exports = config
