import type { DataFunctionArgs } from "@remix-run/cloudflare";
import { handleAuth } from "~/utils/server/remix-auth.server";

export let loader = async (data: DataFunctionArgs) => {
  console.log("loader", data.request.url);
  const result = await handleAuth(data);
  return result;
};

export let action = async (data: DataFunctionArgs) => {
  console.log("action", data.request.url);
  const result = await handleAuth(data);
  return result;
};
