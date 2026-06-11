const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Webpack configuration for the React renderer process
// The renderer runs in a browser context, so we target web
module.exports = {
  mode: process.env.NODE_ENV || 'development',
  target: 'web',
  entry: './src/renderer/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        // Use ts-loader to transpile TypeScript files
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        // Process CSS files through PostCSS (for Tailwind) and style-loader
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    // Generate HTML file that loads our bundled React app
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    // Configure development server for hot module replacement
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
  devtool: 'source-map',
};
