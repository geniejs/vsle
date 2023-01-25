import React from "react";
import { useFetcher, useLocation, useMatches } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/cloudflare";
import type { LinksFunction } from "@remix-run/cloudflare";
import { cssBundleHref } from "@remix-run/css-bundle";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import reset from "@unocss/reset/tailwind.css";
import pico from "@picocss/pico/css/pico.css";
import uno from "./uno.css";
import global from "./global.css";
import { use100vh } from "react-div-100vh";

let isMount = true;
export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: pico },
  { rel: "stylesheet", href: reset },
  { rel: "stylesheet", href: uno },
  { rel: "stylesheet", href: global },
];
export default function App() {
  let location = useLocation();
  let matches = useMatches();
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
  const vh = use100vh();
  return (
    <html
      className="font-sans"
      lang="en"
      style={{ minHeight: `${vh}px`, height: `${vh}px` }}
    >
      <head>
        <Meta />
        <link rel="manifest" href="/resources/manifest.webmanifest" />
        <Links />
      </head>
      <body className="bg-richblue-200 h-full">
        <header></header>
        <main>
          <Outlet />
          <ScrollRestoration /> <Scripts /> <LiveReload />
        </main>

        <footer></footer>
      </body>
    </html>
  );
}
