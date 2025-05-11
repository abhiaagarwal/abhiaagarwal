import { getCollection, render, type CollectionEntry } from "astro:content";

/**
 * Represents a node in the hierarchical structure of the blog.
 *
 * @property {string} id - The unique identifier of the node, e.g., `path/to/file` or `path/to/folder`.
 * @property {string} slug - The slug of the node, e.g., `path/to/file` or `path/to/folder`.
 * @property {string} title - The title of the node.
 * @property {boolean} isFolder - Indicates if the node represents a folder.
 * @property {boolean} isFolderNote - Indicates if the node represents the content for its parent folder.
 * @property {(CollectionEntry<"blog">["data"]|undefined)} data - The frontmatter from the markdown file, if applicable.
 * @property {(string|undefined)} parent - The id of the parent node.
 * @property {Set<string>} children - The ids of child nodes.
 * @property {Set<string>} outgoingLinks - The ids of linked posts/pages.
 * @property {Set<string>} backlinks - The ids of posts/pages linking to this one.
 * @property {(string|undefined)} contentPath - If `isFolderNote`, this is the `id` of the node that provides its content.
 */
export interface HierarchicalBlogNode {
    id: string;
    slug: string;
    title: string;
    isFolder: boolean;
    isFolderNote: boolean;
    data?: CollectionEntry<"blog">["data"];
    parent?: string;
    children: Set<string>;
    outgoingLinks: Set<string>;
    backlinks: Set<string>;
    contentPath?: string;
}

async function createBlogIndex(): Promise<Map<string, HierarchicalBlogNode>> {
    const blogEntries = await getCollection("blog");
    const hierarchicalIndex = new Map<string, HierarchicalBlogNode>();

    for (const post of blogEntries) {
        const { remarkPluginFrontmatter } = await render(post);

        const slug = post.id;

        const pathSegments = slug.split("/");
        let currentPath = "";
        let parentId: string | undefined = undefined;

        for (let i = 0; i < pathSegments.length - 1; i++) {
            const segment = pathSegments[i];
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;

            if (!hierarchicalIndex.has(currentPath)) {
                hierarchicalIndex.set(currentPath, {
                    id: currentPath,
                    slug: currentPath,
                    title: segment,
                    isFolder: true,
                    isFolderNote: false,
                    children: new Set(),
                    parent: parentId,
                    outgoingLinks: new Set(),
                    backlinks: new Set(),
                });
            }
            if (parentId) {
                hierarchicalIndex.get(parentId)?.children.add(currentPath);
            }
            parentId = currentPath;
        }

        const postTitle =
            post.data.title ??
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            slug.split("/").pop()!;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const internalLinks: string[] =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            remarkPluginFrontmatter.internalLinks.map((link: string) =>
                link.startsWith("/posts/")
                    ? link.slice("/posts/".length)
                    : link,
            ) ?? [];

        const postNode: HierarchicalBlogNode = {
            id: slug,
            slug: slug,
            title: postTitle,
            isFolder: false,
            isFolderNote: false,
            data: post.data,
            parent: parentId,
            children: new Set(),
            outgoingLinks: new Set(internalLinks),
            backlinks: new Set(),
        };

        hierarchicalIndex.set(slug, postNode);

        if (parentId) {
            const parentNode = hierarchicalIndex.get(parentId);
            if (parentNode) {
                parentNode.children.add(slug);
            }
        }

        if (parentId) {
            const parentFolderNode = hierarchicalIndex.get(parentId);
            const slugSegments = slug.split("/");
            const postSlugLastSegment = slugSegments.pop();

            const parentFolderName = parentId.split("/").pop();

            if (parentFolderNode && postSlugLastSegment === parentFolderName) {
                parentFolderNode.isFolderNote = true;
                parentFolderNode.contentPath = slug;

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const thisPostNode = hierarchicalIndex.get(slug)!;
                thisPostNode.isFolderNote = true;
                parentFolderNode.children.delete(slug);
            }
        }
    }

    for (const [sourceId, sourceNode] of hierarchicalIndex) {
        for (const linkedId of sourceNode.outgoingLinks) {
            const targetNode = hierarchicalIndex.get(linkedId);
            if (targetNode) {
                targetNode.backlinks.add(sourceId);
            } else {
                // console.warn(`[BlogIndex] Dangling link: ${sourceId} links to ${linkedId}, which does not exist.`);
            }
        }
    }

    return hierarchicalIndex;
}

export const blogIndex: Promise<Map<string, HierarchicalBlogNode>> =
    createBlogIndex();
