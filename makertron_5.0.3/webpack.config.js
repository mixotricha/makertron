var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './main.js',
  output: { path: __dirname, filename: 'bundle.js' , publicPath: '/' },
  module: {
    loaders: [
      { test: /.jsx?$/, loader: 'babel-loader', exclude: /node_modules/, query: { presets: ['es2015', 'react'] } },
      { test: /\.css$/,  loader: "style-loader!css-loader" },
      { test: /\.less$/, loader: "style-loader!css-loader!less-loader" },
      { test: /\.gif$/, loader: "url-loader?mimetype=image/png" },
      { test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/, loader: "url-loader?mimetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/, loader: "file-loader?name=[name].[ext]" }
    ]
  }
};
