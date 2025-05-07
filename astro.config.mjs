import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import remarkWikiLink from "@portaljs/remark-wiki-link";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import { remarkExtractWikiLinks } from "./src/plugins/remark-extract-wikilinks";

// https://astro.build/config
export default defineConfig({
    site: "https://abhi.rodeo",
    prefetch: true,
    trailingSlash: "never",
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
                        "posts/" + slug.slice("Content/".length),
                    ],
                },
            ],
            remarkExtractWikiLinks,
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
