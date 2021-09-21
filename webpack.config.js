const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './js/defaultAnalysis.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
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
            template: 'main.html'
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
