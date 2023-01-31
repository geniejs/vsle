import { json } from "@remix-run/cloudflare";

export const onRequest: PagesFunction = ({ request }) => {
  return json({ now: Date.now() });
};
