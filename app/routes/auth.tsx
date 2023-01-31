import { getAuthenticator } from "~/services/auth.server";
import type { DataFunctionArgs } from "@remix-run/cloudflare";
import { useRef } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { SignInForm, SignOutForm } from "remix-auth/src/lib/components";
export const loader = async ({ request, context }: DataFunctionArgs) => {
  const authenticator = getAuthenticator(context.env as Record<string, any>);
  const providers = await authenticator.getProviders(request);
  const user = await authenticator.isAuthenticated(request);
  return { user, providers };
};

export default function Auth() {
  const { user, providers } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const loading = fetcher.state === "loading" || fetcher.state === "submitting";
  const signOutForm = useRef<HTMLFormElement>(null);
  return (
    <div className="">
      <section className="container">
        <p>{fetcher.state}</p>
        <p>{fetcher.type}</p>
        {user ? (
          <div>
            <h1 className="text-center text-4xl">{user.name}</h1>
            <SignOutForm ref={signOutForm} fetcher={fetcher}>
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
            </SignOutForm>
          </div>
        ) : (
          <>
            {Object.entries(providers).map(([key, provider]) => {
              return (
                <SignInForm
                  fetcher={fetcher}
                  providerId={provider.id}
                  key={key}
                >
                  <input
                    type="hidden"
                    name="callbackUrl"
                    value={
                      typeof document !== "undefined"
                        ? window.location.href
                        : ""
                    }
                  />
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
                </SignInForm>
              );
            })}
            {Object.entries(providers).map(([key, provider]) => {
              return (
                <SignInForm
                  fetcher={fetcher}
                  providerId={provider.id}
                  key={key}
                  options={{
                    callbackUrl:
                      typeof document !== "undefined"
                        ? window.location.href
                        : "",
                  }}
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
                </SignInForm>
              );
            })}
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
