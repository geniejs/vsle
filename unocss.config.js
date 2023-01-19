import presetWind from "@unocss/preset-wind";
import { defineConfig } from "unocss";
import presetAttributify from "@unocss/preset-attributify";
import presetIcons from "@unocss/preset-icons";
import transformerDirectives from "@unocss/transformer-directives";
import presetWebFonts from "@unocss/preset-web-fonts";
import { presetForms } from "@julr/unocss-preset-forms";
import presetTheme from "unocss-preset-theme";

// console.log('resetCss', resetCss)
// console.log('globalCss', globalCss)
// @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Overpass:wght@400;500;600;700;800;900&display=swap');
const richblue = {
  100: "#7da6ff",
  200: "#598dff",
  300: "#446bc1",
  400: "#37569b",
  500: "#2a4175",
  600: "#243967",
  700: "#1c2c4f",
  800: "#0f1729",
  900: "#090e1a",
};
let darkRichBlue = Object.keys(richblue)
  .reverse()
  .reduce((acc, key, i) => {
    acc[100 * (i + 1)] = richblue[key];
    return acc;
  }, {});
export default defineConfig({
  rules: [["custom-rule", { color: "red" }]],
  shortcuts: {
    "custom-shortcut": "text-lg text-orange hover:text-teal",
  },
  transformers: [transformerDirectives()],
  presets: [
    presetAttributify(),
    presetWind({
      dark: "media",
    }),
    presetForms(),
    presetIcons({
      scale: 1.0,
      cdn: "https://esm.sh/",
    }),
    presetWebFonts({
      provider: "google", // default provider
      fonts: {
        // these will extend the default theme
        sans: [
          "Overpass",
          {
            name: "sans-serif",
            provider: "none",
          },
        ],
        mono: [
          "JetBrains Mono",
          {
            name: "monospace",
            provider: "none",
          },
        ],
      },
    }),
    presetTheme({
      theme: {
        dark: {
          colors: {
            richblue: darkRichBlue,
          },
        },
      },
    }),
  ],

  theme: {
    colors: {
      richblue,
    },
  },
});

// UnoCSS({
//   content: [
//     "./app/**/*.{js,ts,jsx,tsx}",
//     "node_modules/daisyui/dist/**/*.js",
//     "node_modules/react-daisyui/dist/**/*.js",
//   ],
//   presets: [
//     presetAttributify(),
//     presetWind(),
//     // presetIcons(),
//     // presetWebFonts({
//     //   provider: "google", // default provider
//     //   fonts: {
//     //     // these will extend the default theme
//     //     sans: "Overpass",
//     //     mono: ["JetBrains Mono"],
//     //     // custom ones
//     //     lobster: "Lobster",
//     //     lato: [
//     //       {
//     //         name: "Lato",
//     //         weights: ["400", "700"],
//     //         italic: true,
//     //       },
//     //       {
//     //         name: "sans-serif",
//     //         provider: "none",
//     //       },
//     //     ],
//     //   },
//     // }),
//   ],
// });
