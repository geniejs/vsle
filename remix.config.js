require("dotenv").config();
const { withEsbuildOverride } = require("remix-esbuild-override");

withEsbuildOverride((option, { isServer, isDev }) => {
  if (isServer) {
    option.define = {
      ...option.define,
      process: JSON.stringify({
        env: {
          ...process.env,
        },
      }),
    };
  }
  return option;
});

module.exports = {
  serverBuildTarget: "cloudflare-pages",
  server: "./server.ts",
  devServerBroadcastDelay: 1000,
  ignoredRouteFiles: ["**/.*"],
  serverDependenciesToBundle: [
    "@auth/core",
    "oauth4webapi",
    "@auth/core/providers/google",
    "@auth/core/providers/email",
    "@novu/node",
    "preact-render-to-string",
  ],
  future: {
    unstable_cssModules: false,
    unstable_vanillaExtract: false,
    unstable_cssSideEffectImports: false,
    unstable_dev: true,
  },
};
