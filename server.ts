import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";
const pagesFunctionHandler = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => ({ data: context.data, env: context.env }),
});

export function onRequest(context: EventContext<any, any, any>) {
  return pagesFunctionHandler(context);
}
