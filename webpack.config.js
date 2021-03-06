const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: {
        'main': './js/defaultAnalysis.js',
        'single': './js/singleAnalysis.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        splitChunks: {
        chunks: "all"
        }
    },
    mode: 'development',
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "images", to: "images" },
                { from: "styles", to: "styles" },
            ],
        }),
        new HtmlWebpackPlugin({
            filename: "main.html",
            template: 'main.html',
            chunks: ['main']
        }),
        new HtmlWebpackPlugin({
            filename: "single.html",
            template: 'single.html',
            chunks: ['single']
        }),
        // Note: devServer below serves data directory at its root. Therefore, ./healthy is mapped to data/healthy.
        // When using your own dataset, modify the variable below and the devServer static directory (if using devServer).
        new webpack.DefinePlugin({
            DATA_DIR: JSON.stringify('./healthy')
        })
    ],
    devServer: {
        // There is no need to include explicitly include the dist output directory 
        // because the devServer automatically serves the exports from above
        static: {directory: path.join(__dirname, 'data')},
        compress: true,
        port: 9000
    }
};
