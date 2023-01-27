import { getAuthenticator } from "~/services/auth.server";
import type { DataFunctionArgs } from "@remix-run/cloudflare";
import type { FetcherWithComponents, FormMethod } from "@remix-run/react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

export const loader = async ({ request }: DataFunctionArgs) => {
  const authenticator = getAuthenticator(process.env as Record<string, string>);
  const providers = await authenticator.getProviders(request);
  const user = await authenticator.isAuthenticated(request);
  return { user, providers };
};

function RemixAuthJsFetcher({
  fetcher,
  action,
  providerId,
  children,
  basePath = "/auth",
  method = "post",
}: React.PropsWithChildren<{
  fetcher: FetcherWithComponents<any>;
  action: string;
  providerId?: string;
  basePath?: string;
  method?: FormMethod;
}>) {
  const form = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const csrfFetcher = useFetcher();
  const pathname = `${basePath}/${action}${providerId ? `/${providerId}` : ""}`;
  const [csrfToken, setCsrfToken] = useState<string | undefined>(
    fetcher?.data?.csrfToken
  );

  useEffect(() => {
    if (
      csrfFetcher.type === "done" &&
      csrfToken !== csrfFetcher.data?.csrfToken
    ) {
      setCsrfToken(csrfFetcher.data?.csrfToken);
    }
  }, [csrfToken, csrfFetcher]);

  useEffect(() => {
    if (csrfToken && fetcher.state === "idle" && submitting && form.current) {
      const formData = new FormData(form.current);
      formData.append("csrfToken", csrfToken);
      fetcher.submit(formData, {
        method,
        action: pathname,
      });
      setSubmitting(false);
    }
  }, [csrfToken, fetcher, method, pathname, submitting]);

  return (
    <fetcher.Form
      ref={form}
      method="get"
      action={pathname}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitting(true);
        csrfFetcher.load(`${basePath}/csrf`);
      }}
    >
      {children}
    </fetcher.Form>
  );
}

export default function Auth() {
  const { user, providers } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const loading = fetcher.state === "loading" || fetcher.state === "submitting";
  console.log("{fetcher}", {
    state: fetcher.state,
    type: fetcher.type,
    data: fetcher.data,
  });

  return (
    <div className="">
      <section className="container">
        <p>{fetcher.state}</p>
        <p>{fetcher.type}</p>
        {user ? (
          <div>
            <h1 className="text-center text-4xl">{user.name}</h1>
            <RemixAuthJsFetcher fetcher={fetcher} action="signout">
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
            </RemixAuthJsFetcher>
          </div>
        ) : (
          <>
            {Object.keys(providers).map((key) => {
              const provider = providers[key];
              return (
                <RemixAuthJsFetcher
                  fetcher={fetcher}
                  action="signin"
                  providerId={provider.id}
                  key={key}
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
                </RemixAuthJsFetcher>
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
