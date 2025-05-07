import { getCollection, render, type CollectionEntry } from "astro:content";

interface PostLinkInfo {
    id: string;
    title: string;
    data: CollectionEntry<"blog">["data"];
    outgoingLinks: string[];
}

export interface PostIndexEntry extends PostLinkInfo {
    backlinks: string[];
}

async function createBlogIndex(): Promise<Map<string, PostIndexEntry>> {
    const blogEntries = await getCollection("blog");

    const postsWithOutgoingLinks: PostLinkInfo[] = await Promise.all(
        blogEntries.map(async (post) => {
            const { remarkPluginFrontmatter } = await render(post);

            const internalLinks: string[] =
                remarkPluginFrontmatter.internalLinks.map((post) =>
                    post.slice("/posts/".length),
                );

            return {
                id: post.id,
                title:
                    post.data.title ||
                    post.id.split("/").pop() ||
                    "Untitled Post",
                data: post.data,
                outgoingLinks: internalLinks,
            };
        }),
    );

    const blogIndex = new Map<string, PostIndexEntry>();

    for (const postInfo of postsWithOutgoingLinks) {
        if (postInfo.id) {
            blogIndex.set(postInfo.id, {
                ...postInfo,
                backlinks: [],
            });
        } else {
            console.warn(
                "[BlogIndex] Found a post without an ID:",
                postInfo.title,
            );
        }
    }

    for (const sourcePost of postsWithOutgoingLinks) {
        if (!sourcePost.id) continue;

        for (const linkedId of sourcePost.outgoingLinks) {
            const targetPostEntry = blogIndex.get(linkedId);
            if (targetPostEntry) {
                if (!targetPostEntry.backlinks.includes(sourcePost.id)) {
                    targetPostEntry.backlinks.push(sourcePost.id);
                }
            }
        }
    }

    return blogIndex;
}

export const blogIndex: Promise<Map<string, PostIndexEntry>> =
    createBlogIndex();
