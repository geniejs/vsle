import type { LoaderFunction } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { getAuthenticator } from "~/services/auth.server";

export let loader: LoaderFunction = async ({ request, context }) => {
  const user = await getAuthenticator(
    context.env as Record<string, string>
  ).isAuthenticated(request);

  return { user };
};
export default function Index() {
  const { user } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      {user ? (
        <div>
          <h1 className="text-center text-4xl">{user.name}</h1>
          <fetcher.Form method="post" action="/auth/signout/google">
            <p>
              <button
                color="primary"
                type="submit"
                disabled={fetcher.state === "submitting"}
              >
                Sign Out
              </button>
            </p>
          </fetcher.Form>
        </div>
      ) : (
        <fetcher.Form method="post" action="/auth/signin/google">
          <p>
            <button
              color="primary"
              type="submit"
              disabled={fetcher.state === "submitting"}
            >
              Sign In
            </button>
          </p>
        </fetcher.Form>
      )}
    </div>
  );
}
