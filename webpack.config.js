
var path = require('path');

module.exports = {
  entry: './src/main.js',
  devtool: 'source-map',
  target: 'web',
  
  output: {
    path: './dist',
    filename: 'bundle.js'
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader' },
      { test   : /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        loader : 'url-loader'
      },
      { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192' }
    ]
  },
  
  resolve: {
    extensions: ['', '.js', '.scss'],
    root: [
      path.resolve(path.join(__dirname, 'src'))
    ]
  }
};
