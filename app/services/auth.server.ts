import { RemixAuthenticator } from "remix-auth/src/lib";
import Google from "@auth/core/providers/google";
import type { AppLoadContext } from "@remix-run/cloudflare";

// Create an instance of the authenticator
let authenticator: RemixAuthenticator<{ user: any }>;

export const getAuthenticator = (
  env: Record<string, string | undefined> | AppLoadContext
) => {
  if (!authenticator) {
    authenticator = new RemixAuthenticator(
      {
        debug: false, // env.NODE_ENV === "development",
        providers: [
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
