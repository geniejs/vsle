import type { ActionFunction, DataFunctionArgs } from "@remix-run/cloudflare";
import { getAuthenticator } from "~/services/auth.server";

export const loader = async ({
  request,
  params,
  context,
}: DataFunctionArgs) => {
  return await getAuthenticator(
    context.env as Record<string, string>
  ).handleAuthRoute({
    request,
    action: params.action!,
    providerId: params.providerId,
    params,
  });
};

export const action: ActionFunction = async ({ request, params, context }) => {
  return await getAuthenticator(
    context.env as Record<string, string>
  ).handleAuthRoute({
    request,
    action: params.action!,
    providerId: params.providerId,
    params,
  });
};
