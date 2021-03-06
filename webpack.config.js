// webpack.config.js
var webpack = require('webpack');

module.exports = {
  entry: {
    'bundle.min': [
      'bootstrap-webpack!./bootstrap.config.js',
      'babel-polyfill',
      './index.jsx'
    ],
    'bundle': [
      'bootstrap-webpack!./bootstrap.config.js',
      'babel-polyfill',
      './index.jsx'
    ]
  },
  output: {
    path: './dist',
    filename: '[name].js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    })
  ],
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          plugins: ['transform-runtime'],
          presets: ['react', 'es2015', 'stage-0']
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'stage-0']
        }
      },
      { test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      { test: /\.png$/,
        loader: "url-loader?limit=100000"
      },

      // Bootstrap
      {
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff'},
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream'
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.json']
  }
};
