process.env.NODE_ENV = process.env.NODE_ENV || 'development' // set a default NODE_ENV

const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
// const FlowBabelWebpackPlugin = require('flow-babel-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')
// const CleanWebpackPlugin = require('clean-webpack-plugin')
const cssProcessor = require('cssnano')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin')
const GitRevisionPlugin = require('git-revision-webpack-plugin')

const dotenv = require('./scripts/dotenv.js')()

const isProduction = require('./scripts/isProduction')

const root = path.resolve(__dirname)
const gitRevisionPlugin = new GitRevisionPlugin()
const publicPath = process.env.PLATFORM_BASE_PATH || '/'
const distRoot = path.resolve(root, 'dist')
// const distDocs = path.resolve(root, 'dist/docs')

const mainEntry = {
    main: path.resolve(root, 'src', 'index.js'),
}

const docsEntry = {
    docs: path.resolve(root, 'src/docs', 'index.js'),
}

module.exports = [{
    mode: isProduction() ? 'production' : 'development',
    entry: mainEntry,
    output: {
        path: distRoot,
        filename: 'bundle_[hash:6].js',
        sourceMapFilename: '[file].map',
        publicPath,
    },
    module: {
        rules: [
            {
                test: /\.ejs$/,
                loader: 'ejs-loader',
            },
            {
                test: /\.mdx?$/,
                use: [
                    'babel-loader',
                    '@mdx-js/loader',
                ],
            },
            {
                test: /\.jsx?$/,
                include: [path.resolve(root, 'src'), path.resolve(root, 'scripts')],
                enforce: 'pre',
                use: [{
                    loader: 'eslint-loader',
                    // options: {
                    //     cache: !isProduction(),
                    // },
                }],
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                include: [path.resolve(root, 'src'), path.resolve(root, 'scripts'), /node_modules\/stringify-object/, /node_modules\/query-string/],
                // options: {
                //     cacheDirectory: !isProduction(),
                // },
            },
            // Images are put to <BASE_URL>/images
            {
                test: /\.(png|jpg|jpeg|svg)$/,
                loader: 'file-loader',
                options: {
                    name: 'images/[name].[ext]',
                    publicPath,
                },
            },
            // Fonts are put to <BASE_URL>/fonts
            {
                test: /\.(woff|woff2|eot|ttf)$/,
                loader: 'file-loader',
                options: {
                    name: 'fonts/[name].[ext]',
                    publicPath,
                },
            },
            // .pcss files treated as modules
            {
                test: /\.pcss$/,
                use: [
                    !isProduction() ? MiniCssExtractPlugin.loader : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoaders: 1,
                            localIdentName: '[name]_[local]',
                        },
                    },
                    'postcss-loader',
                ],
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    !isProduction() ? MiniCssExtractPlugin.loader : MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            includePaths: [
                                path.resolve(__dirname, 'src/shared/assets/stylesheets'),
                            ],
                        },
                    },
                ],
            },
            // po-loader turns .po file into json
            {
                test: /\.po$/,
                use: '@streamr/po-loader',
            },
        ],
    },
    plugins: [
        // Common plugins between prod and dev
        new webpack.ProvidePlugin({
            _: 'underscore',
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: isProduction() ? '[name].css' : '[name].[hash].css',
            chunkFilename: isProduction() ? '[id].css' : '[id].[hash].css',
        }),
        new StyleLintPlugin({
            files: [
                'src/**/*.css',
                'src/**/*.(p|s)css',
            ],
        }),
        new webpack.EnvironmentPlugin(dotenv),
        // new CleanWebpackPlugin([dist]),
    ].concat(isProduction() ? [
        new HtmlWebpackPlugin({
            entry: 'main',
            template: './src/index.ejs',
            filename: './index.html',
        }),
        // Production plugins
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
        }),
        new UglifyJsPlugin({
            uglifyOptions: {
                parallel: true,
                compressor: {
                    warnings: false,
                },
            },
            sourceMap: true,
        }),
        new OptimizeCssAssetsPlugin({
            cssProcessor,
            cssProcessorOptions: {
                discardComments: {
                    removeAll: true,
                },
            },
            canPrint: true,
        }),
    ] : [
        // Dev plugins
        // new FlowBabelWebpackPlugin(),
        new HtmlWebpackPlugin({
            entry: 'main',
            template: './src/index.ejs',
            filename: './index.html',
            inject: false,
        }),
        new webpack.NoEmitOnErrorsPlugin(),
        new WebpackNotifierPlugin(),
        new webpack.EnvironmentPlugin({
            GIT_VERSION: gitRevisionPlugin.version(),
            GIT_COMMIT: gitRevisionPlugin.commithash(),
            GIT_BRANCH: gitRevisionPlugin.branch(),
        }),
    ]),
    devtool: isProduction() ? 'source-map' : 'eval-source-map',
    devServer: {
        historyApiFallback: {
            index: publicPath,
        },
        hot: true,
        inline: true,
        progress: true,
        port: process.env.PORT || 3333,
        publicPath,
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        symlinks: false,
        alias: {
            // Make sure you set up aliases in flow and jest configs.
            $app: __dirname,
            __assets__: path.resolve(__dirname, 'assets'),
            $mp: path.resolve(__dirname, 'src/marketplace/'),
            $userpages: path.resolve(__dirname, 'src/userpages/'),
            $shared: path.resolve(__dirname, 'src/shared/'),
            $sharedStyles: path.resolve(__dirname, 'src/shared/assets/stylesheets'),
            $testUtils: path.resolve(__dirname, 'test/test-utils/'),
            // // When duplicate bundles point to different places.
            $routes: path.resolve(__dirname, 'src/routes'),
            // When duplicate bundles point to different places.
            '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
            'bn.js': path.resolve(__dirname, 'node_modules/bn.js'),
            'eth-lib': path.resolve(__dirname, 'node_modules/eth-lib'),
            eventemitter3: path.resolve(__dirname, 'node_modules/eventemitter3'),
            'hoist-non-react-statics': path.resolve(__dirname, 'node_modules/hoist-non-react-statics'),
            invariant: path.resolve(__dirname, 'node_modules/invariant'),
            isarray: path.resolve(__dirname, 'node_modules/isarray'),
            'query-string': path.resolve(__dirname, 'node_modules/query-string'),
            'regenerator-runtime': path.resolve(__dirname, 'node_modules/regenerator-runtime'),
            'strict-uri-encode': path.resolve(__dirname, 'node_modules/strict-uri-encode'),
            warning: path.resolve(__dirname, 'node_modules/warning'),
            underscore: path.resolve(__dirname, 'node_modules/underscore'),
        },
    },
    // optimization: {
    //     splitChunks: {
    //         cacheGroups: {
    //             styles: {
    //                 name: 'styles',
    //                 test: /\.css$/,
    //                 chunks: 'all',
    //                 enforce: false,
    //             },
    //         },
    //     },
    // },
}, // ////////////////// DOCS BUILD ////////////////////////////////////
{
    mode: isProduction() ? 'production' : 'development',
    entry: docsEntry,
    output: {
        path: distRoot,
        filename: 'bundle_[hash:6].js',
        sourceMapFilename: '[file].map',
        publicPath,
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.ejs$/,
                loader: 'ejs-loader',
            },
            {
                test: /\.mdx?$/,
                use: [
                    'babel-loader',
                    '@mdx-js/loader',
                ],
            },
            {
                test: /\.jsx?$/,
                include: [path.resolve(root, 'src'), path.resolve(root, 'scripts')],
                enforce: 'pre',
                use: [{
                    loader: 'eslint-loader',
                    // options: {
                    //     cache: !isProduction(),
                    // },
                }],
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                include: [path.resolve(root, 'src'), path.resolve(root, 'scripts'), /node_modules\/stringify-object/, /node_modules\/query-string/],
                // options: {
                //     cacheDirectory: !isProduction(),
                // },
            },
            // Images are put to <BASE_URL>/images
            {
                test: /\.(png|jpg|jpeg|svg)$/,
                loader: 'file-loader',
                options: {
                    name: 'images/[name].[ext]',
                    publicPath,
                },
            },
            // Fonts are put to <BASE_URL>/fonts
            {
                test: /\.(woff|woff2|eot|ttf)$/,
                loader: 'file-loader',
                options: {
                    name: 'fonts/[name].[ext]',
                    publicPath,
                },
            },
            // .pcss files treated as modules
            {
                test: /\.pcss$/,
                use: [
                    !isProduction() ? MiniCssExtractPlugin.loader : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoaders: 1,
                            localIdentName: '[name]_[local]',
                        },
                    },
                    'postcss-loader',
                ],
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    !isProduction() ? MiniCssExtractPlugin.loader : MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            includePaths: [
                                path.resolve(__dirname, 'src/shared/assets/stylesheets'),
                            ],
                        },
                    },
                ],
            },
            // po-loader turns .po file into json
            {
                test: /\.po$/,
                use: '@streamr/po-loader',
            },
        ],
    },
    plugins: [
        // Common plugins between prod and dev
        new webpack.ProvidePlugin({
            _: 'underscore',
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: isProduction() ? '[name].css' : '[name].[hash].css',
            chunkFilename: isProduction() ? '[id].css' : '[id].[hash].css',
        }),
        new StyleLintPlugin({
            files: [
                'src/**/*.css',
                'src/**/*.(p|s)css',
            ],
        }),
        new webpack.EnvironmentPlugin(dotenv),
        // new CleanWebpackPlugin([dist]),
    ].concat(isProduction() ? [
        // Production plugins
        new StaticSiteGeneratorPlugin({
            entry: 'docs',
            globals: {
                window: {
                    addEventListener: () => {},
                },
            },
            crawl: false,
            paths: [
                '/docs/',
            ],
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
        }),
        new UglifyJsPlugin({
            uglifyOptions: {
                parallel: true,
                compressor: {
                    warnings: false,
                },
            },
            sourceMap: true,
        }),
        new OptimizeCssAssetsPlugin({
            cssProcessor,
            cssProcessorOptions: {
                discardComments: {
                    removeAll: true,
                },
            },
            canPrint: true,
        }),
    ] : [
        // Dev plugins
        // new FlowBabelWebpackPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new WebpackNotifierPlugin(),
        new webpack.EnvironmentPlugin({
            GIT_VERSION: gitRevisionPlugin.version(),
            GIT_COMMIT: gitRevisionPlugin.commithash(),
            GIT_BRANCH: gitRevisionPlugin.branch(),
        }),
    ]),
    devtool: isProduction() ? 'source-map' : 'eval-source-map',
    devServer: {
        historyApiFallback: {
            index: publicPath,
        },
        hot: true,
        inline: true,
        progress: true,
        port: process.env.PORT || 3333,
        publicPath,
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        symlinks: false,
        alias: {
            // Make sure you set up aliases in flow and jest configs.
            $app: __dirname,
            __assets__: path.resolve(__dirname, 'assets'),
            $mp: path.resolve(__dirname, 'src/marketplace/'),
            $userpages: path.resolve(__dirname, 'src/userpages/'),
            $shared: path.resolve(__dirname, 'src/shared/'),
            $sharedStyles: path.resolve(__dirname, 'src/shared/assets/stylesheets'),
            $testUtils: path.resolve(__dirname, 'test/test-utils/'),
            // // When duplicate bundles point to different places.
            $routes: path.resolve(__dirname, 'src/routes'),
            // When duplicate bundles point to different places.
            '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
            'bn.js': path.resolve(__dirname, 'node_modules/bn.js'),
            'eth-lib': path.resolve(__dirname, 'node_modules/eth-lib'),
            eventemitter3: path.resolve(__dirname, 'node_modules/eventemitter3'),
            'hoist-non-react-statics': path.resolve(__dirname, 'node_modules/hoist-non-react-statics'),
            invariant: path.resolve(__dirname, 'node_modules/invariant'),
            isarray: path.resolve(__dirname, 'node_modules/isarray'),
            'query-string': path.resolve(__dirname, 'node_modules/query-string'),
            'regenerator-runtime': path.resolve(__dirname, 'node_modules/regenerator-runtime'),
            'strict-uri-encode': path.resolve(__dirname, 'node_modules/strict-uri-encode'),
            warning: path.resolve(__dirname, 'node_modules/warning'),
            underscore: path.resolve(__dirname, 'node_modules/underscore'),
        },
    },
    // optimization: {
    //     splitChunks: {
    //         cacheGroups: {
    //             styles: {
    //                 name: 'styles',
    //                 test: /\.css$/,
    //                 chunks: 'all',
    //                 enforce: false,
    //             },
    //         },
    //     },
    // },
}]
