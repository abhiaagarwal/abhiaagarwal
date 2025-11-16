import { csvLoader } from "@ascorbic/csv-loader";
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

const bookmarks = defineCollection({
    loader: csvLoader({ fileName: "bookmarks/technical_bookmarks.csv" }),
    schema: z.object({
        id: z.number(),
        title: z.string(),
        note: z.string().nullable(),
        excerpt: z.string().nullable(),
        url: z.string().url(),
        tags: z
            .string()
            .transform((tags) => tags.split(","))
            .pipe(z.string().trim().array()),
        created: z.coerce.date(),
        cover: z.string().url().nullable(),
        //highlights: z.array(z.string()).default([]),
        favorite: z.boolean().default(false),
    }),
});

export const collections = { blog, bookmarks };
