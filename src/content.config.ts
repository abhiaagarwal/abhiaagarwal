import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
    loader: glob({ pattern: "**/[^_]*.md", base: "./content" }),
});

export const collections = { blog };
