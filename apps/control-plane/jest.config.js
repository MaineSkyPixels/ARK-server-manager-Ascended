const path = require('path');

module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          skipLibCheck: true,
        },
        isolatedModules: true,
      },
    ],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@ark-asa/contracts$': path.resolve(__dirname, '../../packages/contracts/src'),
    '^@ark-asa/db$': '@prisma/client',
    '^@ark-asa/common$': path.resolve(__dirname, '../../packages/common/src'),
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};

