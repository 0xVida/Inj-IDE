import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@injectivelabs/sdk-ts",
    "@injectivelabs/wallet-ts",
    "@injectivelabs/networks",
    "@injectivelabs/utils",
    "@injectivelabs/ts-types",
    "@injectivelabs/sdk-ui-ts"
  ],
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );
    }

    // Ignore workspace directory from watch to prevent HMR during compilation
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
        "**/workspace/**"
      ],
    };

    return config;
  },
};

export default nextConfig;
