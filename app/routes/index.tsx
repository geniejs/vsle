import type { LoaderFunction } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from "@remix-run/react";
import Quintle from "~/components/quintle/quintile";
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
    <div className="leading-5">
      {user ? (
        <div>
          <h1 className="text-center text-4xl">{user.name}</h1>
          <fetcher.Form method="post" action="/auth/signout/google">
            <p>
              <button
                bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
                text="sm white"
                font="mono light"
                p="y-2 x-4"
                border="2 rounded blue-200"
                color="primary"
                type="submit"
                disabled={fetcher.state === "submitting"}
              >
                Sign Out <div className="i-fe-logout" />
              </button>
            </p>
          </fetcher.Form>
        </div>
      ) : (
        <fetcher.Form method="post" action="/auth/signin/google">
          <p>
            <button
              bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
              text="sm white"
              font="mono light"
              p="y-2 x-4"
              border="2 rounded blue-200"
              color="primary"
              type="submit"
              disabled={fetcher.state === "submitting"}
            >
              Sign In <div className="i-fe-login" />
            </button>
          </p>
        </fetcher.Form>
      )}
      <Quintle></Quintle>
    </div>
  );
}
