module.exports = {
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/lib/'],
  collectCoverage: true,
  coverageReporters: ['json', 'html'],
  verbose: true,
  testTimeout: 30000,
};
