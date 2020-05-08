var path = require('path');

var APP_PATH = path.join(__dirname, 'src');
var BUILD_PATH = path.join(__dirname, 'dist');

module.exports = {
    entry: {
        bundle: [path.join(APP_PATH, 'main.js')]
    },
    output: {
        path: BUILD_PATH,
        filename: 'index.js',
        publicPath: '/',
        library: 'watermarkHtml',
        libraryExport: 'default',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {importLoaders: 1}
                    },
                    'postcss-loader',
                    'less-loader'
                ]
            },
            {
                test: /\.js$/,
                include: APP_PATH,
                use: ['babel-loader']
            }
        ]
    },
    resolve: {
        modules: [APP_PATH, 'node_modules'],
        extensions: ['.js']
    },
    mode: 'production',
    performance: {
        hints: false
    }
};
