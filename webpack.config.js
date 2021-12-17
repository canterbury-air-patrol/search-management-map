const path = require('path');

module.exports = {
    entry: './frontend/map.js',
    output: {
        filename: 'frontend.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/static/',
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.png$/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
        ],
    },
    optimization: {
    },
}
