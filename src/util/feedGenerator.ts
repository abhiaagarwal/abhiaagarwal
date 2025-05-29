import { getCollection, render, type CollectionEntry } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Feed } from "feed";
import sanitizeHtml from "sanitize-html";
import {
    blogIndex as blogIndexPromise,
    type HierarchicalBlogNode,
} from "../blogIndex";

dayjs.extend(utc);

export interface FeedConfig {
    siteUrl: string;
    title: string;
    description: string;
    id: string;
    link: string;
    feedLinks: {
        rss2?: string;
        atom?: string;
        json?: string;
    };
}

export interface FeedItem {
    title: string;
    id: string;
    link: string;
    description: string;
    content: string;
    date: Date;
    category: { name: string }[];
}

export class FeedGenerator {
    private allNodesMap: Map<string, HierarchicalBlogNode>;
    private allBlogEntries: CollectionEntry<"blog">[];
    private container: AstroContainer;

    constructor(
        allNodesMap: Map<string, HierarchicalBlogNode>,
        allBlogEntries: CollectionEntry<"blog">[],
        container: AstroContainer,
    ) {
        this.allNodesMap = allNodesMap;
        this.allBlogEntries = allBlogEntries;
        this.container = container;
    }

    static async create(): Promise<FeedGenerator> {
        const allNodesMap = await blogIndexPromise;
        const allBlogEntries = await getCollection("blog");
        const container = await AstroContainer.create();
        return new FeedGenerator(allNodesMap, allBlogEntries, container);
    }

    /**
     * Get all published posts recursively from a starting point
     * If folderNode is null, gets all posts from the entire blog
     * If folderNode is provided, gets all posts under that folder recursively
     */
    getPublishedPosts(
        folderNode: HierarchicalBlogNode | null = null,
        limit?: number,
    ): HierarchicalBlogNode[] {
        const posts: HierarchicalBlogNode[] = [];

        if (folderNode === null) {
            // Get all posts from the entire blog
            for (const node of this.allNodesMap.values()) {
                if (!node.isFolder && !node.isFolderNote) {
                    const originalEntry = this.allBlogEntries.find(
                        (entry) => entry.id === node.id,
                    );
                    if (originalEntry?.data.published !== undefined) {
                        posts.push(node);
                    }
                }
            }
        } else {
            // Recursively collect posts from this folder and all subfolders
            const collectPosts = (nodeId: string) => {
                const node = this.allNodesMap.get(nodeId);
                if (!node) return;

                if (node.isFolder) {
                    // If it's a folder, recursively collect from its children
                    for (const childId of node.children) {
                        collectPosts(childId);
                    }
                } else {
                    // If it's a post, check if it's published and add it
                    const originalEntry = this.allBlogEntries.find(
                        (entry) => entry.id === node.id,
                    );
                    if (originalEntry?.data.published !== undefined) {
                        posts.push(node);
                    }
                }
            };

            // Start collection from the folder's children
            for (const childId of folderNode.children) {
                collectPosts(childId);
            }
        }

        // Sort by published date, newest first
        const sortedPosts = posts.sort((a, b) => {
            const aDate = a.data?.published
                ? dayjs(a.data.published)
                : dayjs(0);
            const bDate = b.data?.published
                ? dayjs(b.data.published)
                : dayjs(0);
            return bDate.diff(aDate);
        });

        return limit ? sortedPosts.slice(0, limit) : sortedPosts;
    }

    /**
     * Convert a blog node to a feed item
     */
    async nodeToFeedItem(
        node: HierarchicalBlogNode,
        siteUrl: string,
    ): Promise<FeedItem> {
        const itemUrl = `${siteUrl}posts/${node.id}/`;
        const itemTitle = node.title;
        const itemDate = node.data?.published
            ? dayjs(node.data.published).toDate()
            : new Date();

        let sanitizedContent = "";
        let itemDescription = node.data?.description ?? "";

        // For posts (not folders), try to get the rendered content
        if (!node.isFolder) {
            const originalEntry = this.allBlogEntries.find(
                (entry) => entry.id === node.id,
            );
            if (originalEntry) {
                try {
                    const { Content } = await render(originalEntry);
                    const content =
                        await this.container.renderToString(Content);
                    sanitizedContent = sanitizeHtml(content);
                } catch (error) {
                    console.warn(
                        `Failed to render content for ${node.id}:`,
                        error,
                    );
                }
            }
        } else {
            // For folders, use a generic description
            itemDescription =
                itemDescription || `Explore ${itemTitle} and its contents`;
        }

        return {
            title: itemTitle,
            id: itemUrl,
            link: itemUrl,
            description: itemDescription,
            content: sanitizedContent,
            date: itemDate,
            category: node.data?.tags
                ? node.data.tags.map((tag) => ({ name: tag }))
                : [],
        };
    }

    /**
     * Create a Feed instance with the given configuration and items
     */
    createFeed(config: FeedConfig, items: FeedItem[]): Feed {
        const feed = new Feed({
            title: config.title,
            description: config.description,
            id: config.id,
            link: config.link,
            language: "en",
            image: `${config.siteUrl}opengraph/default.png`,
            favicon: `${config.siteUrl}favicon.ico`,
            copyright: `© ${new Date().getFullYear().toString()} Abhi Agarwal`,
            updated: items.length > 0 ? items[0].date : new Date(),
            generator: "Astro",
            feedLinks: config.feedLinks,
            author: {
                name: "Abhi Agarwal",
                email: "feed@abhi.rodeo",
                link: config.siteUrl,
            },
        });

        for (const item of items) {
            feed.addItem({
                title: item.title,
                id: item.id,
                link: item.link,
                description: item.description,
                content: item.content,
                author: [
                    {
                        name: "Abhi Agarwal",
                        email: "feed@abhi.rodeo",
                        link: config.siteUrl,
                    },
                ],
                date: item.date,
                category: item.category,
            });
        }

        return feed;
    }

    /**
     * Generate a feed with RSS, Atom, and JSON variants
     * If folderNode is null, generates main site feed
     * If folderNode is provided, generates folder-specific feed
     */
    async generateFeed(
        siteUrl: string,
        format: "rss" | "atom" | "json",
        folderNode: HierarchicalBlogNode | null = null,
        limit?: number,
    ): Promise<string> {
        const posts = this.getPublishedPosts(folderNode, limit);
        const items = await Promise.all(
            posts.map((post) => this.nodeToFeedItem(post, siteUrl)),
        );

        const config: FeedConfig = folderNode
            ? {
                  siteUrl,
                  title: `${folderNode.title} - Abhi Agarwal`,
                  description:
                      folderNode.data?.description ??
                      `Latest posts from ${folderNode.title} on Abhi Agarwal's blog`,
                  id: `${siteUrl}posts/${folderNode.id}/`,
                  link: `${siteUrl}posts/${folderNode.id}/`,
                  feedLinks: {
                      rss2: `${siteUrl}posts/${folderNode.id}.xml`,
                      atom: `${siteUrl}posts/${folderNode.id}.atom`,
                      json: `${siteUrl}posts/${folderNode.id}.json`,
                  },
              }
            : {
                  siteUrl,
                  title: "Abhi Agarwal",
                  description:
                      "Software Engineer & Writer. Latest posts from my blog.",
                  id: siteUrl,
                  link: siteUrl,
                  feedLinks: {
                      rss2: `${siteUrl}rss.xml`,
                      atom: `${siteUrl}rss.atom`,
                      json: `${siteUrl}rss.json`,
                  },
              };

        const feed = this.createFeed(config, items);

        switch (format) {
            case "rss":
                return feed.rss2();
            case "atom":
                return feed.atom1();
            case "json":
                return feed.json1();
            default:
                throw new Error(`Unsupported feed format: ${format as string}`);
        }
    }

    /**
     * Generate a folder feed - convenience method
     */
    async generateFolderFeed(
        folderNode: HierarchicalBlogNode,
        siteUrl: string,
        format: "rss" | "atom" | "json",
    ): Promise<string> {
        return this.generateFeed(siteUrl, format, folderNode);
    }

    /**
     * Generate a main site feed - convenience method
     */
    async generateMainFeed(
        siteUrl: string,
        format: "rss" | "atom" | "json",
        limit = 20,
    ): Promise<string> {
        return this.generateFeed(siteUrl, format, null, limit);
    }
}
