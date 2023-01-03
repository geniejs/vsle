import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";
import { createRequestHandlerWithAuth } from "./authServer";
import Google from "@auth/core/providers/google";
import type { Profile } from "@auth/core/types";
import type { Provider } from "@auth/core/providers";
const pagesFunctionHandler = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => ({ data: context.data, env: context.env }),
});

export function onRequest(context: EventContext<any, any, any>) {
  //return pagesFunctionHandler(context);
  return createRequestHandlerWithAuth(
    context.request,
    context.env,
    context.data,
    {
      providers: [
        Google({
          clientId: context.env.GOOGLE_CLIENT_ID!,
          clientSecret: context.env.GOOGLE_CLIENT_SECRET!,
        }) as unknown as Provider<Profile>,
        // GitHub({
        //   clientId: process.env.GOOGLE_CLIENT_ID!,
        //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // }) as unknown as Provider<Profile>,
      ],
    },
    () => pagesFunctionHandler(context)
  );
}
// createRequestHandler({
//   build: require(BUILD_DIR),
//   mode: process.env.NODE_ENV,
// })(req, res, next)

// export declare type RequestHandler = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
