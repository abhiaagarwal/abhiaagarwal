import { getCollection, render, type CollectionEntry } from "astro:content";
import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface RemarkPluginFrontmatter {
    internalLinks?: string[];
    createdTime?: string;
    lastModified?: string;
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
 * @property {Dayjs} createdTime - The git creation time as a dayjs object.
 * @property {Dayjs} lastModified - The git last modified time as a dayjs object.
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
    createdTime: Dayjs;
    lastModified?: Dayjs;
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
            // Folders don't have git times, so we use current time as default
            const defaultTime = new Date().toISOString();

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
                createdTime: dayjs(defaultTime),
                lastModified: dayjs(defaultTime),
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
    remarkPluginFrontmatter: RemarkPluginFrontmatter,
): HierarchicalBlogNode {
    const slug = post.id;
    const postTitle = post.data.title ?? slug.split("/").pop() ?? "Untitled";

    const createdTime = remarkPluginFrontmatter.createdTime;
    const lastModified = remarkPluginFrontmatter.lastModified;

    if (createdTime === undefined) {
        throw new Error(`Git times missing for post: ${slug}.`);
    }

    const createdDayjs = dayjs(createdTime);
    const lastModifiedDayjs = lastModified ? dayjs(lastModified) : undefined;

    if (
        !createdDayjs.isValid() ||
        (lastModifiedDayjs && !lastModifiedDayjs.isValid())
    ) {
        throw new Error(
            `Invalid git times for post: ${slug}. Created: ${createdTime}, Modified: ${lastModified ?? "undefined"}`,
        );
    }

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
        createdTime: createdDayjs,
        lastModified: lastModifiedDayjs,
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
    return (
        remarkPluginFrontmatter.internalLinks?.map((link: string) => {
            if (link.startsWith("/posts/")) {
                return link.slice("/posts/".length);
            }
            if (link.startsWith("/")) {
                return link.slice(1);
            }
            return link;
        }) ?? []
    );
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

        const postNode = createPostNode(
            post,
            internalLinks,
            parentId,
            remarkPluginFrontmatter,
        );
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
