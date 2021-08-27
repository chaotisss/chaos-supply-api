const path = require("path");
const webpack = require("webpack");

const mode = process.env.NODE_ENV || "production";

const workerConfig = {
  output: {
    filename: `worker.${mode}.js`,
    path: path.join(__dirname, "dist"),
  },
  mode,
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    plugins: [],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
};

const launcherConfig = {
  entry: "./launcher/index.ts",
  output: {
    filename: `launcher.js`,
    path: path.join(__dirname, "dist"),
  },
  mode: "production",
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@mattiasbuelens/web-streams-polyfill": "web-streams-polyfill",
    },
    plugins: [],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.node$/,
        loader: "node-loader",
      },
      {
        test: /\worker.production.js?$/,
        type: "asset/source",
      },
    ],
  },
  target: "node",
};

module.exports =
  process.env.TARGET === "launcher" ? launcherConfig : workerConfig;
