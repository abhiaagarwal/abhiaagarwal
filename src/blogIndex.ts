import { getCollection, render, type CollectionEntry } from "astro:content";

interface RemarkPluginFrontmatter {
    internalLinks?: string[];
}

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

/**
 * Creates folder nodes for all path segments leading to the given slug
 */
function ensureFolderHierarchy(
    slug: string,
    hierarchicalIndex: Map<string, HierarchicalBlogNode>,
): string | undefined {
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

        // Link parent to child
        if (parentId) {
            hierarchicalIndex.get(parentId)?.children.add(currentPath);
        }

        parentId = currentPath;
    }

    return parentId;
}

/**
 * Creates a post node and adds it to the hierarchy
 */
function createPostNode(
    post: CollectionEntry<"blog">,
    internalLinks: string[],
    parentId: string | undefined,
): HierarchicalBlogNode {
    const slug = post.id;
    const postTitle = post.data.title ?? slug.split("/").pop() ?? "Untitled";

    return {
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
}

/**
 * Detects and handles folder notes - posts that represent content for their parent folder
 */
function handleFolderNote(
    postNode: HierarchicalBlogNode,
    hierarchicalIndex: Map<string, HierarchicalBlogNode>,
): void {
    const { id: slug, parent: parentId } = postNode;

    if (!parentId) return;

    const parentFolderNode = hierarchicalIndex.get(parentId);
    if (!parentFolderNode) return;

    const postFileName = slug.split("/").pop();
    const parentFolderName = parentId.split("/").pop();

    if (postFileName === parentFolderName) {
        parentFolderNode.isFolderNote = true;
        parentFolderNode.contentPath = slug;
        postNode.isFolderNote = true;

        parentFolderNode.children.delete(slug);
    }
}

function processInternalLinks(
    remarkPluginFrontmatter: RemarkPluginFrontmatter,
): string[] {
    const internalLinks: string[] =
        remarkPluginFrontmatter.internalLinks?.map((link: string) =>
            link.startsWith("/posts/") ? link.slice("/posts/".length) : link,
        ) ?? [];

    return internalLinks;
}

function setupBacklinks(
    hierarchicalIndex: Map<string, HierarchicalBlogNode>,
): void {
    for (const [sourceId, sourceNode] of hierarchicalIndex) {
        for (const linkedId of sourceNode.outgoingLinks) {
            const targetNode = hierarchicalIndex.get(linkedId);
            if (targetNode) {
                targetNode.backlinks.add(sourceId);
            }
            // else {
            //     console.warn(`[BlogIndex] Dangling link: ${sourceId} links to ${linkedId}, which does not exist.`);
            // }
        }
    }
}

async function createBlogIndex(): Promise<Map<string, HierarchicalBlogNode>> {
    const blogEntries = await getCollection("blog");
    const hierarchicalIndex = new Map<string, HierarchicalBlogNode>();

    for (const post of blogEntries) {
        const { remarkPluginFrontmatter } = await render(post);
        const slug = post.id;

        const parentId = ensureFolderHierarchy(slug, hierarchicalIndex);

        const internalLinks = processInternalLinks(remarkPluginFrontmatter);

        const postNode = createPostNode(post, internalLinks, parentId);
        hierarchicalIndex.set(slug, postNode);

        if (parentId) {
            hierarchicalIndex.get(parentId)?.children.add(slug);
        }

        handleFolderNote(postNode, hierarchicalIndex);
    }

    setupBacklinks(hierarchicalIndex);

    return hierarchicalIndex;
}

export const blogIndex: Promise<Map<string, HierarchicalBlogNode>> =
    createBlogIndex();
