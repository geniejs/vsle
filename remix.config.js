require("dotenv").config();
const { withEsbuildOverride } = require("remix-esbuild-override");

// AUTH_SECRET=
// AUTH_TRUST_HOST=true
// GITHUB_CLIENT_ID=
// GITHUB_CLIENT_SECRET=

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
  serverDependenciesToBundle: ["@auth/core", "oauth4webapi"],
};
