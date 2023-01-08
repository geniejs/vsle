import type { AuthConfig } from "@auth/core";
import { Auth } from "@auth/core";
import Google from "@auth/core/providers/google";
import { parse } from "cookie";

import type { DataFunctionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { AuthAction, Profile } from "@auth/core/types";
import type {
  BuiltInProviderType,
  Provider,
  RedirectableProviderType,
} from "@auth/core/providers";
import type { LiteralUnion } from "next-auth/react";
import { redirect } from "react-router";

export function authjsDefaultCookies(useSecureCookies: boolean) {
  const cookiePrefix = useSecureCookies ? "__Secure-" : "";
  return {
    // default cookie options
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
    },
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${useSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
    },
  };
}

export interface RemixAuthConfig extends AuthConfig {
  /**
   * Defines the base path for the auth routes.
   * If you change the default value,
   * you must also update the callback URL used by the [providers](https://authjs.dev/reference/core/modules/providers).
   *
   * @default "/auth"
   */
  prefix?: string;
  trustHost?: boolean;
  secret?: string;
}

const actions: AuthAction[] = [
  "providers",
  "session",
  "csrf",
  "signin",
  "signout",
  "callback",
  "verify-request",
  "error",
];

type ProviderID<P> = LiteralUnion<
  P extends RedirectableProviderType
    ? P | BuiltInProviderType
    : BuiltInProviderType
>;

const getValue = (
  key: string,
  searchParams: URLSearchParams,
  params: DataFunctionArgs["params"]
): string | undefined => {
  return searchParams.get(key) || params[key];
};
async function getBody(req: Request): Promise<Record<string, any> | undefined> {
  if (!("body" in req) || !req.body || req.method !== "POST") return;

  const contentType = req.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return await req.json();
  } else if (contentType?.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await req.text());
    return Object.fromEntries(params);
  }
}
export async function handleAuth<
  P extends RedirectableProviderType | undefined = undefined
>({ request, context, params }: DataFunctionArgs) {
  console.log("_____________________________________________________");

  const url = new URL(request.url);
  const searchParams = url.searchParams || new URLSearchParams();
  const formData = (await getBody(request.clone())) || {};
  Object.entries(formData).forEach(([key, val]) => {
    if (typeof val === "string") {
      searchParams.set(key, val);
    }
  });

  const method = request.method.toUpperCase();
  const cookies = parse(request.headers.get("Cookie") ?? "") ?? {};

  //CONFIG
  const env = context.env as Record<string, string>;
  const authOptions: RemixAuthConfig = {
    debug: env.NODE_ENV === "development",
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
      }) as unknown as Provider<Profile>,
    ],
  };
  authOptions.secret ??= env.AUTH_SECRET;

  authOptions.trustHost ??= !!(
    env.AUTH_TRUST_HOST ?? env.NODE_ENV === "development"
  );
  const authjsCookies = {
    ...authjsDefaultCookies(
      authOptions.useSecureCookies ?? url.protocol === "https:"
    ),
    // Allow user cookie options to override any cookie settings above
    ...authOptions.cookies,
  };

  const action = getValue("action", searchParams, params) as
    | AuthAction
    | undefined;
  const providerId: ProviderID<P> | undefined = getValue(
    "providerId",
    searchParams,
    params
  );
  console.log("searchParams", searchParams);
  console.log("cookies", cookies);
  let csrfToken =
    cookies[authjsCookies.csrfToken.name] ||
    getValue("csrfToken", searchParams, params);

  const callbackUrl =
    cookies[authjsCookies.callbackUrl.name] ||
    getValue("callbackUrl", searchParams, params);

  const status = {
    ok: false,
    status: 400,
    body: "Bad Request",
  };

  const isPost = method === "POST";
  console.log({
    url: url.href,
    csrfToken,
    isPost,
    action,
    providerId,
    csrfCookieName: authjsCookies?.csrfToken?.name,
  });
  const redirectPost = getValue("redirect", searchParams, params) ?? true;
  // TODO: Support custom providers
  const isCredentials = providerId === "credentials";
  const isEmail = providerId === "email";
  const isSupportingReturn = isCredentials || isEmail;

  if (!providerId && isPost) {
    status.body = 'Missing "provider" parameter';
  } else if (!action || !actions.includes(action as AuthAction)) {
    status.body = 'Invalid/Missing "action" parameter';
  } else {
    if (action === "callback") {
      console.log("action", action);
      return Auth(request, authOptions);
    }
    if (!csrfToken && isPost) {
      const csrfPath =
        String(url.href).replace(`/${action}`, "/csrf").split("/csrf")[0] +
        "/csrf";
      const remixAuthRedirectUrl = new URL(csrfPath);
      const formData = await request.formData();
      formData.forEach((val, key) => {
        if (typeof val === "string") {
          remixAuthRedirectUrl.searchParams.set(key, val);
        }
      });
      remixAuthRedirectUrl.searchParams.set("remixAuthRedirectUrl", url.href);
      console.log("redirect", { csrfToken, isPost });
      return redirect(remixAuthRedirectUrl.href);
    } else if (csrfToken && !isPost && action && providerId) {
      console.log("fetch");
      const res = await fetch(url.origin + url.pathname, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Cookie: request.headers.get("Cookie") as string,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: url.searchParams,
      });

      const data = (await res.clone().json()) as { url: string };
      console.log("data", data);
      const error = new URL(data.url).searchParams.get("error");

      if ((redirectPost || !isSupportingReturn) && !error) {
        return redirect(data.url ?? callbackUrl);
      }

      return res;
    }
    if (isPost) {
      console.log("isPost --- ", { csrfToken });
      return await Auth(request, authOptions);
    } else {
      const authResult = await Auth(request, authOptions);

      if (searchParams.has("remixAuthRedirectUrl")) {
        const remixAuthRedirectUrl = new URL(
          searchParams.get("remixAuthRedirectUrl")!
        );
        remixAuthRedirectUrl.searchParams.delete("remixAuthRedirectUrl");

        const authJson = ((await authResult.json()) || {}) as Record<
          string,
          any
        >;
        Object.keys(authJson).forEach((key) => {
          remixAuthRedirectUrl.searchParams.set(key, authJson[key]);
        });
        // console.log("rdirectUrl", redirectUrl.href);
        return redirect(remixAuthRedirectUrl.href, {
          headers: authResult.headers,
        });
      } else {
        return authResult;
      }
    }
  }

  return json({
    action,
    provider: providerId,
    status,
  });
}

//BACKUP
// async function handleAuth<
//   P extends RedirectableProviderType | undefined = undefined
// >({ request, context, params }: DataFunctionArgs) {
//   const url = new URL(request.url);
//   const searchParams = url.searchParams || new URLSearchParams();
//   const method = request.method.toUpperCase();
//   let formData: FormData;
//   try {
//     formData = await request.formData();
//   } catch {
//     formData = new FormData();
//   }
//   const action = getValue("action", formData, searchParams, params) as
//     | AuthAction
//     | undefined;
//   const providerId: ProviderID<P> | undefined = getValue(
//     "providerId",
//     formData,
//     searchParams,
//     params
//   );
//   let csrfToken = getValue("csrfToken", formData, searchParams, params);

//   const env = context.env as Record<string, string>;
//   const authOptions: RemixAuthConfig = {
//     providers: [
//       Google({
//         clientId: env.GOOGLE_CLIENT_ID!,
//         clientSecret: env.GOOGLE_CLIENT_SECRET!,
//       }) as unknown as Provider<Profile>,
//     ],
//   };
//   authOptions.secret ??= env.AUTH_SECRET;

//   authOptions.trustHost ??= !!(
//     env.AUTH_TRUST_HOST ?? env.NODE_ENV === "development"
//   );
//   const status = {
//     ok: false,
//     status: 400,
//     body: "Bad Request",
//   };
//   const isPost = method === "POST";
//   if (!providerId && isPost) {
//     status.body = 'Missing "provider" parameter';
//   } else if (!action || !actions.includes(action as AuthAction)) {
//     status.body = 'Invalid/Missing "action" parameter';
//   } else {
//     if (!csrfToken && isPost) {
//       url.searchParams.set("providerId", providerId!);
//       const csrfTokenResponse = await fetch(
//         url.href.replace(`/${action}`, "/csrf")
//       );
//       csrfToken = (
//         (await csrfTokenResponse.json()) as {
//           csrfToken: string;
//         }
//       ).csrfToken;
//       formData.set("csrfToken", csrfToken);
//       console.log("csrfToken", csrfToken);
//     }
//     if (!csrfToken && isPost) {
//       status.body = 'Could not get "csrfToken"';
//     } else {
//       if (isPost) {
//         formData.forEach((val, key) => {
//           if (typeof val === "string") {
//             searchParams.set(key, val);
//           }
//         });
//         searchParams.set("providerId", providerId!);
//         if (searchParams.has("csrfToken")) {
//           const searchCsrfToken = searchParams.get("csrfToken");
//           if (searchCsrfToken?.includes("|")) {
//             searchParams.set("csrfToken", searchCsrfToken.split("|")[0]);
//           }
//         }
//         return await Auth(
//           new Request(request, {
//             body: searchParams.toString(),
//           }),
//           authOptions
//         );
//       } else {
//         return await Auth(request, authOptions);
//       }
//     }
//   }

//   return json({
//     action,
//     provider: providerId,
//     status,
//   });
// }
