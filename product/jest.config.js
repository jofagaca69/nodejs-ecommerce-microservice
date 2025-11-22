module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  // Excluir el test de Mocha (product.test.js) que usa chai
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/test/product.test.js' // Test de integración con Mocha
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/test/**',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};

