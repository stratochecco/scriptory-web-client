const path = require('path');
const ManifestPlugin = require('webpack-manifest-plugin');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) => {
    const prod = env === 'production';
    const dev = env === 'development';

    let config = {
        mode: prod ? 'production' : 'development',
        entry: {
            main: './src/index.js'
        },
        resolve: {
            alias: {
                vue$: 'vue/dist/vue.esm.js',
            },
            extensions: ['*', '.js', '.vue', '.json'],
            symlinks: false
        },
        output: {
            path: path.resolve(__dirname, './dist'),
            filename: '[name].[contenthash:6]' + (prod ? '.min' : '') + '.js',
            publicPath: 'https://cdn.jsdelivr.net/gh/stratochecco/scriptory-web-client/dist/'
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    terserOptions: {
                        ecma: 6
                    }
                }),
                new OptimizeCSSAssetsPlugin({})
            ]
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    /*options: {
                        hotReload: false
                    }*/
                },
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    //exclude: /node_modules/,
                    include: [
                        path.resolve(__dirname, './src'),
                        path.resolve(__dirname, './node_modules/bootstrap-vue')
                    ]
                },
                {
                    test: /\.s?[ac]ss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: 'css-loader', options: { url: false } },
                        { loader: 'sass-loader', options: { sourceMap: !prod } }
                    ]
                }
            ]
        },
        plugins: [
            new webpack.HashedModuleIdsPlugin(),
            new VueLoaderPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash:6]' + (prod ? '.min' : '') + '.css'
            }),
            new CleanWebpackPlugin(['dist/']),
            new ManifestPlugin()
            /*new BundleAnalyzerPlugin({
                analyzerMode: 'static'
            })*/
        ]
    };

    if (dev) {
        config.devtool = 'cheap-module-eval-source-map';
    }

    return config;
};
