import React from "react";
import { useLoaderData, useLocation, useMatches } from "@remix-run/react";
import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import type { LinksFunction } from "@remix-run/cloudflare";
import { signIn, signOut } from "./utils/client/auth.client";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import styles from "./tailwind.css";
import { Button } from "react-daisyui";
import Div100vh from "react-div-100vh";

let isMount = true;
export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});
export let loader: LoaderFunction = async ({ context }) => {
  const session = await (context.data as Record<string, any>).getSession();
  return { session };
};
export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];
export default function App() {
  let location = useLocation();
  let matches = useMatches();
  const { session } = useLoaderData();
  React.useEffect(() => {
    let mounted = isMount;
    isMount = false;
    if ("serviceWorker" in navigator) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller?.postMessage({
          type: "REMIX_NAVIGATION",
          isMount: mounted,
          location,
          matches,
          manifest: window.__remixManifest,
        });
      } else {
        let listener = async () => {
          await navigator.serviceWorker.ready;
          navigator.serviceWorker.controller?.postMessage({
            type: "REMIX_NAVIGATION",
            isMount: mounted,
            location,
            matches,
            manifest: window.__remixManifest,
          });
        };
        navigator.serviceWorker.addEventListener("controllerchange", listener);
        return () => {
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            listener
          );
        };
      }
    }
  }, [location, matches]);

  return (
    <html className="font-overpass" lang="en">
      <head>
        <Meta />
        <link rel="manifest" href="/resources/manifest.webmanifest" />
        <Links />
      </head>
      <body>
        <Div100vh>
          {session?.user ? (
            <div>
              <h1 className="text-center text-4xl">{session?.user?.name}</h1>
              <Button color="secondary" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Button color="primary" onClick={() => signIn("google")}>
              Sign In with Google
            </Button>
          )}
          <Outlet />
          <ScrollRestoration /> <Scripts /> <LiveReload />
        </Div100vh>
      </body>
    </html>
  );
}
