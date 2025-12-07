module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/test/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000 // Timeout más largo para operaciones asíncronas
};