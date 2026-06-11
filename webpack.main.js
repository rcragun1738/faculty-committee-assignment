const path = require('path');

// Webpack configuration for the Electron main process
// The main process runs in Node.js, not the browser, so we use node as the target
module.exports = {
  mode: process.env.NODE_ENV || 'development',
  target: 'electron-main',
  entry: './src/main/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        // Use ts-loader to transpile TypeScript files
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    // These are native modules that shouldn't be bundled
    sqlite3: 'commonjs2 sqlite3',
    'node-pre-gyp': 'commonjs2 node-pre-gyp',
  },
  devtool: 'source-map',
};
