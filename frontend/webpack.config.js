const minifier = require("terser-webpack-plugin"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  webpackPwaManifest = require("webpack-pwa-manifest"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  StyleExtHtmlWebpackPlugin = require("style-ext-html-webpack-plugin"),
  serviceWorkerPlugin = require("serviceworker-webpack-plugin");
const mode = "development";
// const mode = "production";
const devOrProd = (a, b) => {
  return "production" === mode ? a : b;
};

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
            // targets: ">0.25%, not dead, not IE 11, not operamini all",
            presets: [
              [
                "@babel/preset-env",
                {
                  // targets: ">0.5%,not ie 11,not op_mini all"
                }
              ]
            ],
            plugins: ["@babel/plugin-transform-runtime"]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: "css-loader",
            options: {
              // modules: true,
              // importLoaders: 1,
              // localIdentName: "[sha1:hash:hex:4]"
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|ico|svg)$/,
        use: [{ loader: "url-loader", options: { fallback: "file-loader" } }]
      }
    ]
  },
  entry: `${__dirname}/static/js/app.js`,
  output: { path: `${__dirname}/docs`, filename: "[name]-[hash].js" },
  mode,
  optimization: {
    minimizer: devOrProd([new minifier({ parallel: !0 })], []),
    splitChunks: {
      chunks: "all"
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `${__dirname}/index.html`,
      xhtml: !0,
      favicon: "./favicon.ico",
      minify: devOrProd(
        {
          collapseBooleanAttributes: !0,
          collapseWhitespace: !0,
          html5: !0,
          minifyCSS: !0,
          removeEmptyAttributes: !0,
          removeRedundantAttributes: !0
        },
        !1
      )
    }),
    new webpackPwaManifest({
      background_color: "#e3e3e3",
      description: "Web Message using WebRTC",
      display: "standalone",
      fingerprints: !0,
      icons: [
        {
          src: `${__dirname}/assets/icons/icon.png`,
          sizes: [72, 96, 128, 144, 152, 192, 256, 384, 512]
        }
      ],
      inject: !0,
      lang: "en",
      name: "File Share",
      start_url: "/",
      short_name: "File Share",
      "theme-color": "#1976d2"
    }),
    new MiniCssExtractPlugin({
      filename: "[name]-[hash].css",
      chunkFilename: "[id]-[hash].css"
    }),
    // new StyleExtHtmlWebpackPlugin({ minify: devOrProd(!0, !1) }),
    
  ]
};
