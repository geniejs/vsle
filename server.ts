import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";
const pagesFunctionHandler = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => {
    return { data: context.data, env: context.env };
  },
});

export async function onRequest(context: EventContext<any, any, any>) {
  // const db = context.env["vsle-keystone"];
  // const r = await db.batch([
  //   db.prepare("PRAGMA table_list"),
  //   db.prepare("PRAGMA table_info(User)"),
  // ]);
  // console.log(JSON.stringify(r, null, 2));

  return await pagesFunctionHandler(context);
}
