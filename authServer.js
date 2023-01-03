import { Auth } from "@auth/core";
const dev = process.env.NODE_ENV === "development";
export async function getSession(req, config) {
    var _a, _b;
    (_a = config.secret) !== null && _a !== void 0 ? _a : (config.secret = process.env.AUTH_SECRET);
    (_b = config.trustHost) !== null && _b !== void 0 ? _b : (config.trustHost = true);
    const url = new URL("/api/auth/session", req.url);
    const request = new Request(url, { headers: req.headers });
    const response = await Auth(request, config);
    const { status = 200 } = response;
    const data = await response.json();
    if (!data || !Object.keys(data).length)
        return null;
    if (status === 200)
        return data;
    throw new Error(data.message);
}
const actions = [
    "providers",
    "session",
    "csrf",
    "signin",
    "signout",
    "callback",
    "verify-request",
    "error",
];
function AuthHandle(prefix, authOptions) {
    return function (request, context) {
        var _a;
        context = context || {};
        const url = new URL(request.url);
        (_a = context.getSession) !== null && _a !== void 0 ? _a : (context.getSession = () => getSession(request, authOptions));
        const action = url.pathname
            .slice(prefix.length + 1)
            .split("/")[0];
        if (!actions.includes(action) || !url.pathname.startsWith(prefix + "/")) {
            return authOptions.requestHandler(request, context);
        }
        return Auth(request, authOptions);
    };
}
/**
 * The main entry point to `@auth/remix`
 * @see https://remix.authjs.dev
 */
export function RemixAuth(options) {
    var _a, _b, _c;
    const { prefix = "/auth", ...authOptions } = options;
    (_a = authOptions.secret) !== null && _a !== void 0 ? _a : (authOptions.secret = process.env.AUTH_SECRET);
    (_b = authOptions.trustHost) !== null && _b !== void 0 ? _b : (authOptions.trustHost = !!((_c = process.env.AUTH_TRUST_HOST) !== null && _c !== void 0 ? _c : dev));
    return AuthHandle(prefix, authOptions);
}
export function CloudflarePagesRemixAuth(options) {
    var _a, _b, _c, _d;
    var _e;
    const { prefix = "/auth", context, pagesFunctionHandler, ...authOptions } = options;
    const request = context.request;
    (_a = authOptions.secret) !== null && _a !== void 0 ? _a : (authOptions.secret = process.env.AUTH_SECRET);
    (_b = authOptions.trustHost) !== null && _b !== void 0 ? _b : (authOptions.trustHost = !!((_c = process.env.AUTH_TRUST_HOST) !== null && _c !== void 0 ? _c : dev));
    const url = new URL(request.url);
    (_d = (_e = context.data).getSession) !== null && _d !== void 0 ? _d : (_e.getSession = () => getSession(request, authOptions));
    const action = url.pathname
        .slice(prefix.length + 1)
        .split("/")[0];
    if (!actions.includes(action) || !url.pathname.startsWith(prefix + "/")) {
        return pagesFunctionHandler(context);
    }
    return Auth(request, authOptions);
}
