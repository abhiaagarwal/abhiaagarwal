// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

import react from "@astrojs/react";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [
            tailwindcss(),
            visualizer({
                emitFile: true,
                filename: "stats.html",
            }),
        ],
    },
    integrations: [react(), sitemap()],
});
