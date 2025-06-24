module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  // Suppress console output during tests
  silent: true,
  // Verbose output for test results
  verbose: true,
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests
  resetModules: true,
  // Collect coverage from these files
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/__tests__/**',
  ],
  // Only ignore node_modules, not src
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  // Add jest-dom matchers for all tests
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.js'],
  // Exclude setup files from being treated as test files
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/setupTests.js'
  ],
}; 