import { getCollection, render, type CollectionEntry } from "astro:content";

/**
 * Represents a node in the hierarchical structure of the blog.
 *
 * @property {string} id - The unique identifier of the node, e.g., `path/to/file` or `path/to/folder`.
 * @property {string} slug - The slug of the node, e.g., `path/to/file` or `path/to/folder`.
 * @property {string} title - The title of the node.
 * @property {boolean} isFolder - Indicates if the node represents a folder.
 * @property {boolean} isFolderNote - Indicates if the node represents the content for its parent folder.
 * @property {(string|undefined)} filePath - The path to the actual markdown file, present if not a synthetic folder node.
 * @property {(CollectionEntry<"blog">["data"]|undefined)} data - The frontmatter from the markdown file, if applicable.
 * @property {(string|undefined)} parent - The id of the parent node.
 * @property {string[]} children - The ids of child nodes.
 * @property {string[]} outgoingLinks - The ids of linked posts/pages.
 * @property {string[]} backlinks - The ids of posts/pages linking to this one.
 * @property {(string|undefined)} contentPath - If `isFolderNote`, this is the `id` of the node that provides its content.
 */
export interface HierarchicalBlogNode {
    id: string;
    slug: string;
    title: string;
    isFolder: boolean;
    isFolderNote: boolean;
    filePath?: string;
    data?: CollectionEntry<"blog">["data"];
    parent?: string;
    children: string[];
    outgoingLinks: string[];
    backlinks: string[];
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
                    children: [],
                    parent: parentId,
                    outgoingLinks: [],
                    backlinks: [],
                });
            }
            if (
                parentId &&
                !hierarchicalIndex.get(parentId)?.children.includes(currentPath)
            ) {
                hierarchicalIndex.get(parentId)?.children.push(currentPath);
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
            filePath: slug,
            data: post.data,
            parent: parentId,
            children: [],
            outgoingLinks: internalLinks,
            backlinks: [],
        };

        hierarchicalIndex.set(slug, postNode);

        if (parentId) {
            const parentNode = hierarchicalIndex.get(parentId);
            if (parentNode && !parentNode.children.includes(slug)) {
                parentNode.children.push(slug);
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

                const childIndex = parentFolderNode.children.indexOf(slug);
                if (childIndex > -1) {
                    parentFolderNode.children.splice(childIndex, 1);
                }
            }
        }
    }

    for (const [sourceId, sourceNode] of hierarchicalIndex) {
        for (const linkedId of sourceNode.outgoingLinks) {
            const targetNode = hierarchicalIndex.get(linkedId);
            if (targetNode) {
                if (!targetNode.backlinks.includes(sourceId)) {
                    targetNode.backlinks.push(sourceId);
                }
            } else {
                // console.warn(`[BlogIndex] Dangling link: ${sourceId} links to ${linkedId}, which does not exist.`);
            }
        }
    }

    for (const node of hierarchicalIndex.values()) {
        if (node.isFolder) {
            node.children.sort();
        }
    }

    return hierarchicalIndex;
}

export const blogIndex: Promise<Map<string, HierarchicalBlogNode>> =
    createBlogIndex();
