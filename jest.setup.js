jest.mock('react-native-localize', () => ({
  getLocales: () => [
    {languageTag: 'en-US', languageCode: 'en', countryCode: 'US', isRTL: false},
  ],
  getNumberFormatSettings: () => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  }),
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(() => undefined),
    getBoolean: jest.fn(() => false),
    getNumber: jest.fn(() => undefined),
    remove: jest.fn(),
    contains: jest.fn(() => false),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  }),
}));
