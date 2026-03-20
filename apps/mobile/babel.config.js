module.exports = function (api) {
  api.cache(true)

  const isTest = process.env.NODE_ENV === 'test'

  const plugins = []

  // Skip tamagui babel plugin during tests — it tries to load tamagui.config.ts
  // which requires a full Tamagui setup. Module mocks handle tamagui in tests.
  if (!isTest) {
    plugins.push([
      '@tamagui/babel-plugin',
      {
        components: ['tamagui'],
        config: './tamagui.config.ts',
        logTimings: true,
        disableExtraction: process.env.NODE_ENV === 'development',
      },
    ])
  }

  // Reanimated plugin must be listed last
  plugins.push('react-native-reanimated/plugin')

  return {
    presets: ['babel-preset-expo'],
    plugins,
  }
}
