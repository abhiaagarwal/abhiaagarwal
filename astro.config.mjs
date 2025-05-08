import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import remarkWikiLink from "@portaljs/remark-wiki-link";
import remarkCallout from "@r4ai/remark-callout";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import rehypeShiftHeading from "rehype-shift-heading";
import { remarkExtractWikiLinks } from "./src/plugins/remark-extract-wikilinks";

// https://astro.build/config
export default defineConfig({
    site: "https://abhi.rodeo",
    prefetch: true,
    trailingSlash: "always",
    vite: {
        plugins: [tailwindcss()],
    },
    markdown: {
        remarkPlugins: [
            [
                remarkWikiLink,
                {
                    pathFormat: "obsidian-absolute",
                    wikiLinkResolver: (slug) => [
                        `posts/${slug.slice("Content/".length)}`,
                    ],
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
        preact(),
        expressiveCode({
            themes: ["catppuccin-mocha"],
            frames: false,
            styleOverrides: {
                codeFontFamily: "var(--font-mono)",
                codeFontSize: "var(--font-size-md)",
            },
        }),
    ],
});
