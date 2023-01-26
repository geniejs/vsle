/* eslint-disable @typescript-eslint/no-throw-literal */
import type {
  DataFunctionArgs,
  AppLoadContext,
} from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import type { Provider, RedirectableProviderType } from "@auth/core/providers";
import { Auth } from "@auth/core";
import { parse } from "cookie";
import {
  getBody,
  getValue,
  authjsDefaultCookies,
} from "remix-auth/src/utils/utils";
import type { ProviderID, RemixAuthConfig } from "remix-auth/src/types";
type AuthAction =
  | "providers"
  | "session"
  | "csrf"
  | "signin"
  | "signout"
  | "callback"
  | "verify-request"
  | "error";

const actions = [
  "providers",
  "session",
  "csrf",
  "signin",
  "signout",
  "callback",
  "verify-request",
  "error",
] as const;
export class RemixAuthenticator<User> {
  private readonly options: RemixAuthConfig;

  constructor(
    options: RemixAuthConfig,
    env: Record<string, string | undefined> | AppLoadContext
  ) {
    this.options = options;
    this.options.secret ??= env.AUTH_SECRET as string | undefined;
    this.options.trustHost ??= !!(
      env.AUTH_TRUST_HOST ?? env.NODE_ENV === "development"
    );
  }

  async handleAuthRoute<
    P extends RedirectableProviderType | undefined = undefined
  >({
    request,
    action,
    providerId,
    params,
  }: {
    request: Request;
    action: string;
    providerId?: ProviderID<P> | undefined;
    params?: DataFunctionArgs["params"];
  }) {
    const url = new URL(request.url);
    const searchParams = url.searchParams || new URLSearchParams();
    const formData = (await getBody(request.clone())) ?? {};
    Object.entries(formData).forEach(([key, val]) => {
      if (typeof val === "string") {
        searchParams.set(key, val);
      }
    });

    const method = request.method.toUpperCase();
    const cookies = parse(request.headers.get("Cookie") ?? "") ?? {};

    const authjsCookies = {
      ...authjsDefaultCookies(
        this.options.useSecureCookies ?? url.protocol === "https:"
      ),
      // Allow user cookie options to override any cookie settings above
      ...this.options.cookies,
    };

    action = action || (getValue("action", searchParams, params) as AuthAction);
    providerId = providerId ?? getValue("providerId", searchParams, params);

    console.log(
      'getValue("callbackUrl", searchParams, params)',
      getValue("callbackUrl", searchParams, params)
    );
    const callbackUrl =
      getValue("callbackUrl", searchParams, params) ??
      cookies[authjsCookies.callbackUrl.name] ??
      url.href;

    console.log({
      url,
      method,
      action,
      providerId,
      callbackUrl,
      referrer: request.headers.get("Referer"),
      "X-Remix-Auth-Internal": request.headers.get("X-Remix-Auth-Internal"),
      "X-Auth-Return-Redirect": request.headers.get("X-Auth-Return-Redirect"),
    });
    const status = {
      status: 400,
      body: "Bad Request",
    };

    const isPost = method === "POST";
    if (!providerId && isPost && action !== "signout") {
      // IF POST, PROVIDER IS REQUIRED
      status.body = 'Missing "provider" parameter';
    } else if (!action || !actions.includes(action as AuthAction)) {
      // ACTION IS REQUIRED
      status.body = 'Invalid/Missing "action" parameter';
    } else {
      return await Auth(request, this.options);
    }

    throw new Response(status.body, {
      status: status.status,
      statusText: status.body,
    });
  }

  async getSession(req: Request): Promise<{ user?: User } | null> {
    const url = new URL("/api/auth/session", req.url);
    const request = new Request(url, { headers: req.headers });
    const response = await Auth(request, this.options);
    const { status = 200 } = response;
    const data: Record<string, any> = await response.json();

    if (!data || !Object.keys(data).length) return null;
    if (status === 200) return data;
    throw new Error(data?.message || data?.error || "Unknown error");
  }

  /**
   * Call this to check if the user is authenticated. It will return a Promise
   * with the user object or null, you can use this to check if the user is
   * logged-in or not without triggering the whole authentication flow.
   * @example
   * async function loader({ request }: LoaderArgs) {
   *   // if the user is not authenticated, redirect to login
   *   let user = await authenticator.isAuthenticated(request, {
   *     failureRedirect: "/login",
   *   });
   *   // do something with the user
   *   return json(privateData);
   * }
   * @example
   * async function loader({ request }: LoaderArgs) {
   *   // if the user is authenticated, redirect to /dashboard
   *   await authenticator.isAuthenticated(request, {
   *     successRedirect: "/dashboard"
   *   });
   *   return json(publicData);
   * }
   * @example
   * async function loader({ request }: LoaderArgs) {
   *   // manually handle what happens if the user is or not authenticated
   *   let user = await authenticator.isAuthenticated(request);
   *   if (!user) return json(publicData);
   *   return sessionLoader(request);
   * }
   */
  async isAuthenticated(
    request: Request,
    options?: { successRedirect?: never; failureRedirect?: never }
  ): Promise<User | null>;
  async isAuthenticated(
    request: Request,
    options: { successRedirect: string; failureRedirect?: never }
  ): Promise<null>;
  async isAuthenticated(
    request: Request,
    options: { successRedirect?: never; failureRedirect: string }
  ): Promise<User>;
  async isAuthenticated(
    request: Request,
    options: { successRedirect: string; failureRedirect: string }
  ): Promise<null>;
  async isAuthenticated(
    request: Request,
    options:
      | { successRedirect?: never; failureRedirect?: never }
      | { successRedirect: string; failureRedirect?: never }
      | { successRedirect?: never; failureRedirect: string }
      | { successRedirect: string; failureRedirect: string } = {}
  ): Promise<User | null> {
    const session = await this.getSession(request);

    if (session?.user) {
      if (options.successRedirect) throw redirect(options.successRedirect);
      else return session.user;
    }

    if (options.failureRedirect) throw redirect(options.failureRedirect);
    else return null;
  }

  async getProviders(req: Request): Promise<Record<string, Provider>> {
    const url = new URL("/api/auth/providers", req.url);
    const request = new Request(url, { headers: req.headers });
    const response = await Auth(request, this.options);
    const { status = 200 } = response;
    const data: Record<string, any> = await response.json();
    if (!data || !Object.keys(data)?.length) return {};
    if (status === 200) return data as Record<string, Provider>;
    throw new Error(data?.message || data?.error || "Unknown error");
  }

  isValidAction(action: string | undefined): boolean {
    return action ? actions.includes(action as AuthAction) : false;
  }
}
