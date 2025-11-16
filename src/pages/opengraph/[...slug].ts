import { OGImageRoute } from "astro-og-canvas";
import { blogIndex as blogIndexPromise } from "../../blogIndex";

const blogIndex = await blogIndexPromise;

interface Page {
    title: string;
    description: string;
    isFolder: boolean;
    kind: string;
}

const pages: Record<string, Page> = Object.fromEntries(
    Array.from(blogIndex.entries())
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(
            ([_slug, node]) =>
                !node.isFolderNote || node.data?.published === undefined,
        )
        .map(([slug, node]) => [
            slug,
            {
                title: "abhi.rodeo",
                description: node.title,
                isFolder: node.isFolder,
                kind: node.data?.kind ?? "",
            },
        ]),
);

export const { getStaticPaths, GET } = OGImageRoute({
    param: "slug",
    pages: pages,
    getImageOptions: (_path, page: Page) => {
        return {
            title: page.title,
            description: page.description,
            bgGradient: [[255, 245, 253]],
            fonts: [
                "./node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2",
            ],
            font: {
                title: {
                    size: 48,
                    families: ["Lora", "serif"],
                    color: [26, 16, 27],
                },
                description: {
                    size: 80,
                    families: ["Lora", "serif"],
                    color: [26, 16, 27],
                    weight: "SemiBold",
                },
            },
            padding: 100,
        };
    },
});
