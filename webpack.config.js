const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, { mode }) => ({
  entry: {
    wallet: './src/wallet.ts',
    keyTools: './src/keyTools.ts',
    nodeManager: './src/nodeManager.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify")
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: '[name]',
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: true
  },
  optimization: {
    minimize: mode === 'production',
    minimizer: [new TerserPlugin()],
  },
  experiments: {
    asyncWebAssembly: true,
  },
});
