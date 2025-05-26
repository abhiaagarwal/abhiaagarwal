import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const kind = z.enum(["observations", "notes", "thoughts"]);

const baseSchema = z
    .object({
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
        published: z.coerce.date().optional(),
    })
    .transform((data) => {
        const parsedKind = kind.safeParse(data.tags[0]);
        return {
            ...data,
            kind: parsedKind.success ? parsedKind.data : undefined,
        };
    });

const blog = defineCollection({
    loader: glob({ pattern: "**/[^_]*.md", base: "./content" }),
    schema: baseSchema,
});

export const collections = { blog };
