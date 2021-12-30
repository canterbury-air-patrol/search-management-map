const path = require('path');

module.exports = {
    entry: {
        map: './frontend/map.js',
        pretty: './frontend/pretty.js',
        marinesac: './frontend/marinesac.js',
        marinevectors: './frontend/marinevectors.js',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/static/',
    },
    mode: 'production',
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
