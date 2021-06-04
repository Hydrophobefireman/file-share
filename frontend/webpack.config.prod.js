const minifier = require("terser-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  webpackPwaManifest = require("webpack-pwa-manifest"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  serviceWorkerPlugin = require("serviceworker-webpack-plugin"),
  StyleExtHtmlWebpackPlugin = require("style-ext-html-webpack-plugin");
const mode = "production";
module.exports = {
  devServer: { contentBase: `${__dirname}/docs`, compress: !0, port: 4200 },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  // targets: ">0.5%,not ie 11,not op_mini all"
                },
              ],
            ],
            plugins: ["@babel/plugin-transform-runtime"],
          },
        },
      },
      {
        test: /\.css$/,
        use: [{ loader: MiniCssExtractPlugin.loader }, "css-loader"],
      },
      {
        test: /\.(png|jpg|gif|ico|svg)$/,
        use: [{ loader: "url-loader", options: { fallback: "file-loader" } }],
      },
    ],
  },
  entry: `${__dirname}/static/js/app.js`,
  output: { path: `${__dirname}/docs`, filename: "[name]-[hash].js" },
  mode,
  optimization: {
    minimizer: [new minifier({ parallel: !0 })],
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `${__dirname}/index.html`,
      xhtml: !0,
      favicon: "./favicon.ico",
      minify: {
        collapseBooleanAttributes: !0,
        collapseWhitespace: !0,
        html5: !0,
        minifyCSS: !0,
        removeEmptyAttributes: !0,
        removeRedundantAttributes: !0,
      },
    }),
    new webpackPwaManifest({
      background_color: "#e3e3e3",
      description: "Web Message using WebRTC",
      display: "standalone",
      fingerprints: !0,
      icons: [
        {
          src: `${__dirname}/assets/icons/icon.png`,
          sizes: [72, 96, 128, 144, 152, 192, 256, 384, 512],
        },
      ],
      inject: !0,
      lang: "en",
      name: "File Share",
      start_url: "/",
      short_name: "File Share",
      "theme-color": "#1976d2",
      theme_color: "#1976d2",
    }),
    new MiniCssExtractPlugin({
      filename: "[name]-[hash].css",
      chunkFilename: "[id]-[hash].css",
    }),
    // new StyleExtHtmlWebpackPlugin({ minify: true }),
  ],
};
