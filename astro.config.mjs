// @ts-check
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import compress from "astro-compress";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
    site: "https://abhi.rodeo",
    prefetch: true,
    trailingSlash: "never",
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [
        sitemap(),
        preact(),
        compress(),
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
