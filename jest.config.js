module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|' +
      'react-native|' +
      '@react-navigation|' +
      '@nozbe/watermelondb|' +
      'react-native-actions-sheet|' +
      'react-native-reanimated|' +
      'react-native-gesture-handler|' +
      'react-native-safe-area-context|' +
      '@shopify/flash-list|' +
      'react-native-svg-charts|' +
      'react-native-svg|' +
      'react-native-mmkv|' +
      'react-native-fs|' +
      '@react-native-documents' +
    ')/)',
  ],
};
