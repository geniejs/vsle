import { RemixAuthenticator } from "remix-auth/src/lib";
import Google from "@auth/core/providers/google";
import { Email } from "@auth/core/providers/email";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { Novu } from "@novu/node";
import { D1Adapter } from "@auth/adapter-d1";
import UAParser from "ua-parser-js";
export interface Env {
  "vsle-keystone": D1Database;
}

// Create an instance of the authenticator
let authenticator: RemixAuthenticator<Record<string, unknown>>;

export const getAuthenticator = (env: Record<string, any> | AppLoadContext) => {
  if (!authenticator) {
    const novu = new Novu(env.NOVU_API_KEY as string);
    authenticator = new RemixAuthenticator(
      {
        session: {
          strategy: "jwt",
        },
        debug: env.NODE_ENV === "development",
        adapter: D1Adapter(env["vsle-keystone"] as D1Database),
        providers: [
          Email({
            id: "email",
            name: "Email Magic Link",
            server: env.EMAIL_SERVER as string,
            from: env.EMAIL_FROM as string,
            type: "email",
            async sendVerificationRequest(params) {
              const { identifier, url, request } = params;
              const parser = new UAParser(request.headers.get("User-Agent"));
              await novu.trigger("sendvslemagicemaillink", {
                to: {
                  subscriberId: identifier,
                  email: identifier,
                },
                payload: {
                  verificationUrl: url,
                  email: identifier,
                  using: `${parser.getBrowser().name as string} on ${
                    parser.getOS().name as string
                  }`,
                  requestedAt:
                    new Date().toLocaleString("en-US", {
                      timeZone: "America/Los_Angeles",
                    }) + " PST",
                },
              });
            },
          }),
          Google({
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
          }) as unknown as any,
        ],
      },
      env
    );
  }
  return authenticator;
};
