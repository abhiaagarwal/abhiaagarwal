import sitemap from "@astrojs/sitemap";
import remarkWikiLink from "@portaljs/remark-wiki-link";
import remarkCallout from "@r4ai/remark-callout";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig, fontProviders } from "astro/config";
import rehypeShiftHeading from "rehype-shift-heading";
import { loadEnv } from "vite";
import { remarkExtractWikiLinks } from "./src/plugins/remark-extract-wikilinks";

const resolveSlug = (slug: string) => {
    let splitSlug = slug.split("/");
    if (splitSlug[0] === "Content") {
        splitSlug = splitSlug.slice(1);
    }
    if (splitSlug.at(-1) === splitSlug.at(-2)) {
        splitSlug = splitSlug.slice(0, -1);
    }
    return "posts/" + splitSlug.join("/") + "/";
};

// @ts-expect-error - loadEnv is not typed
const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV, process.cwd(), "");

// https://astro.build/config
export default defineConfig({
    site: PUBLIC_SITE_URL ?? "http://localhost:4321",
    prefetch: true,
    trailingSlash: "always",
    vite: {
        plugins: [tailwindcss()],
    },
    experimental: {
        clientPrerender: true,
        fonts: [
            {
                provider: fontProviders.fontsource(),
                name: "Lora",
                cssVariable: "--font-lora",
                weights: ["300 600"],
                fallbacks: ["serif"],
                subsets: ["latin"],
            },
            {
                provider: fontProviders.fontsource(),
                name: "Fira Code",
                cssVariable: "--font-fira-code",
                weights: ["300 600"],
                fallbacks: ["monospace"],
                subsets: ["latin"],
            },
            {
                provider: fontProviders.fontsource(),
                name: "Open Sans",
                cssVariable: "--font-open-sans",
                weights: ["300 600"],
                fallbacks: ["sans-serif"],
                subsets: ["latin"],
            },
        ],
    },
    markdown: {
        remarkPlugins: [
            [
                remarkWikiLink,
                {
                    pathFormat: "obsidian-absolute",
                    wikiLinkResolver: (slug: string) => [[resolveSlug(slug)]],
                },
            ],
            remarkExtractWikiLinks,
            remarkCallout,
        ],
        rehypePlugins: [
            [
                rehypeShiftHeading,
                {
                    shift: 1,
                },
            ],
        ],
    },
    integrations: [
        sitemap(),
        expressiveCode({
            themes: ["catppuccin-mocha"],
            frames: false,
            styleOverrides: {
                codeFontFamily: "var(--font-mono)",
                codeFontSize: "var(--text-sm)",
                codeFontWeight: "var(--font-weight-normal)",
                codeLineHeight: "var(--leading-relaxed)",
                borderRadius: "var(--radius-md)",
                uiFontFamily: "var(--font-sans)",
                uiFontSize: "var(--text-sm)",
                uiFontWeight: "var(--font-weight-normal)",
                uiLineHeight: "var(--text-sm--line-height)",
            },
        }),
    ],
});
