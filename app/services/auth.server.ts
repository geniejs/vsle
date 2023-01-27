import { RemixAuthenticator } from "remix-auth/src/lib";
import Google from "@auth/core/providers/google";
import { Email } from "@auth/core/providers/email";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getPrisma } from "./prismadb.server";
import { Novu } from "@novu/node";

// Create an instance of the authenticator
let authenticator: RemixAuthenticator<Record<string, unknown>>;

export const getAuthenticator = (
  env: Record<string, string | undefined> | AppLoadContext
) => {
  if (!authenticator) {
    const novu = new Novu(env.NOVU_API_KEY as string);

    authenticator = new RemixAuthenticator(
      {
        session: {
          strategy: "jwt",
        },
        debug: env.NODE_ENV === "development",
        adapter: PrismaAdapter(getPrisma(env as Record<string, string>)) as any,
        providers: [
          Email({
            id: "email",
            name: "Email Magic Link",
            server: env.EMAIL_SERVER as string,
            from: env.EMAIL_FROM as string,
            type: "email",
            async sendVerificationRequest(params) {
              const { identifier, url } = params;
              await novu.trigger("sendvslemagicemaillink", {
                to: {
                  subscriberId: identifier,
                  email: identifier,
                },
                payload: {
                  verificationUrl: url,
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
