// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";
import preact from "@astrojs/preact";
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
    site: "https://abhi.rodeo",
    prefetch: true,
    trailingSlash: "never",
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [sitemap(), preact(), compress()],
});
