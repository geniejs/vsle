import { getAuthenticator } from "~/services/auth.server";
import type { DataFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useFetcher } from "@remix-run/react";
export const loader = async ({ request }: DataFunctionArgs) => {
  const authenticator = getAuthenticator(process.env as Record<string, string>);

  const providers = await authenticator.getProviders(request);
  const user = await authenticator.isAuthenticated(request);
  const csrfToken = authenticator.getCSRFTokenFromCookie(request);
  return { user, providers, csrfToken };
};

export default function Auth() {
  const { user, providers, csrfToken } = useLoaderData<typeof loader>();
  console.log({ csrfToken });
  const fetcher = useFetcher();
  const loading = fetcher.state === "loading" || fetcher.state === "submitting";
  return (
    <div className="">
      <section className="container">
        <p>{fetcher.state}</p>
        <p>{fetcher.type}</p>
        {user ? (
          <div>
            <h1 className="text-center text-4xl">{user.name}</h1>
            <h2 className="text-center text-2xl">{user.email}</h2>
            <h2 className="text-center text-2xl">{user.nickname}</h2>
            <h2 className="text-center text-2xl">{user.username}</h2>

            <fetcher.Form method="post" action="/auth/signout">
              <button
                bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
                text="sm white"
                font="mono light"
                p="y-2 x-4"
                border="2 rounded blue-200"
                color="primary"
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                Sign Out <div className="i-fe-logout" />
              </button>
            </fetcher.Form>
          </div>
        ) : (
          <>
            {Object.keys(providers).map((key) => {
              const provider = providers[key];
              return (
                <fetcher.Form
                  key={key}
                  method="post"
                  action={`/auth/signin/${provider.id}`}
                >
                  {provider.type === "email" && (
                    <>
                      <label htmlFor="email">Email address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email address"
                        required
                      />
                    </>
                  )}
                  <input
                    type="hidden"
                    name="callbackUrl"
                    value={
                      typeof document !== "undefined"
                        ? window.location.href
                        : ""
                    }
                  />
                  <input
                    type="hidden"
                    name="csrfCallbackUrl"
                    value={
                      typeof document !== "undefined"
                        ? window.location.href
                        : ""
                    }
                  />
                  <button
                    bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
                    text="sm white"
                    font="mono light"
                    p="y-2 x-4"
                    border="2 rounded blue-200"
                    color="primary"
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    Sign In with {provider.name} <div className="i-fe-login" />
                  </button>
                </fetcher.Form>
              );
            })}
            <fetcher.Form method="post" action={`/auth/sig/google`}>
              <button
                bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
                text="sm white"
                font="mono light"
                p="y-2 x-4"
                border="2 rounded blue-200"
                color="primary"
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                Bad Action
              </button>
            </fetcher.Form>
            <fetcher.Form method="post" action={`/auth/signin/noid`}>
              <button
                bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
                text="sm white"
                font="mono light"
                p="y-2 x-4"
                border="2 rounded blue-200"
                color="primary"
                type="submit"
                disabled={loading}
                aria-busy={loading}
              >
                Bad Provider
              </button>
            </fetcher.Form>
          </>
        )}
      </section>
      {fetcher.data && (
        <section className="container">
          <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
