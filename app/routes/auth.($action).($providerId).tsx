import type { ActionFunction, LoaderFunction } from "@remix-run/cloudflare";
import { getAuthenticator } from "~/services/auth.server";

export let loader: LoaderFunction = async ({ request, params, context }) => {
  const result = getAuthenticator(
    context.env as Record<string, string>
  ).handleAuthRoute({
    request,
    action: params.action!,
    providerId: params.providerId,
    params,
  });
  return result;
};

export let action: ActionFunction = async ({ request, params, context }) => {
  const result = getAuthenticator(
    context.env as Record<string, string>
  ).handleAuthRoute({
    request,
    action: params.action!,
    providerId: params.providerId,
    params,
  });
  return result;
};
