module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  moduleNameMapper: {
    '^next/image$': '<rootDir>/__mocks__/nextImageMock.tsx',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  }
};
