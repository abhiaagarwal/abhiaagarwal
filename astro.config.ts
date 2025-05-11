import sitemap from "@astrojs/sitemap";
import remarkWikiLink from "@portaljs/remark-wiki-link";
import remarkCallout from "@r4ai/remark-callout";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import rehypeShiftHeading from "rehype-shift-heading";
import { remarkExtractWikiLinks } from "./src/plugins/remark-extract-wikilinks";

const resolveSlug = (slug: string) => {
    let splitSlug = slug.split("/");
    if (splitSlug[0] === "Content") {
        splitSlug = splitSlug.slice(1);
    }
    if (splitSlug.at(-1) === splitSlug.at(-2)) {
        splitSlug = splitSlug.slice(0, -1);
    }
    return splitSlug.join("/");
};

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
                codeFontSize: "var(--font-size-md)",
            },
        }),
    ],
});
