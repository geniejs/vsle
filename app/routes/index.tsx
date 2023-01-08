import type { LoaderFunction } from "@remix-run/server-runtime";
import { useFetcher, useLoaderData } from "@remix-run/react";
import type { SignInOptions } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "react-daisyui";
import Quintle from "~/components/quintle/quintile";
export let loader: LoaderFunction = async ({ context, request }) => {
  const session = (context?.data as Record<string, any>)?.getSession
    ? await (context.data as Record<string, any>).getSession()
    : null;
  const defaultCallbackUrl = new URL(request.url).pathname;

  return { session, defaultCallbackUrl };
};
export default function Index() {
  const { session, defaultCallbackUrl } = useLoaderData();
  const csrf = useFetcher();
  const options: SignInOptions = {};
  // const { callbackUrl, redirect = true } = options ?? {};
  const [callbackUrl, setCallbackUrl] = useState(
    options?.callbackUrl || defaultCallbackUrl
  );
  useEffect(() => {
    if (!callbackUrl) {
      setCallbackUrl(window.location.href);
    }
  }, [callbackUrl]);

  return (
    <>
      {session?.user ? (
        <div>
          <h1 className="text-center text-4xl">{session?.user?.name}</h1>
          <Button color="secondary" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      ) : (
        <csrf.Form method="post" action="/auth/signin/google">
          <input
            type="hidden"
            name="callbackUrl"
            value={callbackUrl || defaultCallbackUrl}
          />
          <p>
            <Button
              color="primary"
              type="submit"
              disabled={csrf.state === "submitting"}
            >
              Sign In
            </Button>
          </p>

          {csrf.type === "done" ? <div>{JSON.stringify(csrf.data)}</div> : null}
        </csrf.Form>
      )}
      <Quintle></Quintle>
    </>
  );
}
