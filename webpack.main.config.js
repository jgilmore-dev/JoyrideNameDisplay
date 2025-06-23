module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  target: 'electron-main',
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: [
    'express',
    'socket.io',
    'http',
    'path',
    'os',
    'fs',
    'url',
    'querystring',
    'crypto',
    'stream',
    'util',
    'events',
    'buffer',
    'process',
    'assert',
    'constants',
    'domain',
    'punycode',
    'string_decoder',
    'timers',
    'tty',
    'vm',
    'zlib',
  ],
};
