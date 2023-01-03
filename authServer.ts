/**
 *
 *
 * :::warning
 * `@auth/remix` is currently experimental. The API _will_ change in the future.
 * :::
 *
 * Remix Auth is the official Remix integration for Auth.js.
 * It provides a simple way to add authentication to your Remix app in a few lines of code.
 *
 *
 * ## Installation
 *
 * ```bash npm2yarn2pnpm
 * npm install @auth/core @auth/remix
 * ```
 *
 * ## Usage
 *
 * Replace the return of createRequestHandler with the return of createRemixAuthHandler, e.g if using express
 * ```ts title="server.ts"
 * import { createRemixAuthHandler } from "@auth/remix";
 * import GitHub from "@auth/core/providers/github"
 *
 * app.all(
 *   "*",
 *   process.env.NODE_ENV === "development"
 *     ? (req, res, next) => {
 *         purgeRequireCache();
 *          return createRemixAuthHandler(createRequestHandler({
 *           build: require(BUILD_DIR),
 *           mode: process.env.NODE_ENV,
 *         }), { providers: [GitHub({ clientId: GITHUB_ID, clientSecret: GITHUB_SECRET })], } ) (req, res, next)
z *       }
 *     : createRequestHandler({
 *         build: require(BUILD_DIR),
 *         mode: process.env.NODE_ENV,
 *       })
 * );
 * ```
 *
 * Don't forget to set the `AUTH_SECRET` [environment variable](https://kit.svelte.dev/docs/modules#$env-static-private). This should be a random 32 character string. On unix systems you can use `openssl rand -hex 32` or check out `https://generate-secret.vercel.app/32`.
 *
 * When deploying your app outside Vercel, set the `AUTH_TRUST_HOST` variable to `true` for other hosting providers like Cloudflare Pages or Netlify.
 *
 * The callback URL used by the [providers](https://authjs.dev/reference/core/modules/providers) must be set to the following, unless you override {@link SvelteKitAuthConfig.prefix}:
 * ```
 * [origin]/auth/callback/[provider]
 * ```
 *
 * ## Signing in and signing out
 *
 * ```ts
 * <script>
 *   import { signIn, signOut } from "@auth/sveltekit/client"
 *   import { page } from "$app/stores"
 * </script>
 *
 * <h1>SvelteKit Auth Example</h1>
 * <p>
 *   {#if $page.data.session}
 *     {#if $page.data.session.user?.image}
 *       <span
 *         style="background-image: url('{$page.data.session.user.image}')"
 *         class="avatar"
 *       />
 *     {/if}
 *     <span class="signedInText">
 *       <small>Signed in as</small><br />
 *       <strong>{$page.data.session.user?.name ?? "User"}</strong>
 *     </span>
 *     <button on:click={() => signOut()} class="button">Sign out</button>
 *   {:else}
 *     <span class="notSignedInText">You are not signed in</span>
 *     <button on:click={() => signIn("github")}>Sign In with GitHub</button>
 *   {/if}
 * </p>
 * ```
 *
 * ## Notes
 *
 * :::info
 * Learn more about `@auth/sveltekit` [here](https://vercel.com/blog/announcing-sveltekit-auth).
 * :::
 *
 * :::info
 * PRs to improve this documentation are welcome! See [this file](https://github.com/nextauthjs/next-auth/blob/main/packages/frameworks-sveltekit/src/lib/index.ts).
 * :::
 *
 * @module main
 */

import { Auth } from "@auth/core";
import type { AuthAction, AuthConfig, Session } from "@auth/core/types";
export async function getSession(
  req: Request,
  env: Record<string, string | undefined>,
  config: AuthConfig
): Promise<Session | null> {
  config.secret ??= env.AUTH_SECRET;
  config.trustHost ??= true;

  const url = new URL("/api/auth/session", req.url);
  const request = new Request(url, { headers: req.headers });
  const response = await Auth(request, config);

  const { status = 200 } = response;
  const data: Session & { message?: string } = await response.json();

  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data;
  throw new Error(data.message);
}

/** Configure the {@link RemixAuth} method. */
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

export function createRequestHandlerWithAuth(
  request: Request,
  env: Record<string, string | undefined>,
  context: Record<string, any> = {},
  options: RemixAuthConfig,
  /**
   * The request handler created from running createRequestHandler from remix (@remix-run/express, @remix-run/netlify, @remix-run/vercel) or createPagesFunctionHandler from @remix-run/cloudflare-pages
   *
   */
  requestHandler: () => Promise<Response | void>
): Promise<Response | void> {
  const { prefix = "/auth", ...authOptions } = options;
  authOptions.secret ??= env.AUTH_SECRET;
  authOptions.trustHost ??= !!(
    env.AUTH_TRUST_HOST ?? env.NODE_ENV === "development"
  );
  const url = new URL(request.url);
  context.getSession ??= () => getSession(request, env, authOptions);

  const action = url.pathname
    .slice(prefix.length + 1)
    .split("/")[0] as AuthAction;

  if (!actions.includes(action) || !url.pathname.startsWith(prefix + "/")) {
    return requestHandler();
  }

  return Auth(request, authOptions);
}
