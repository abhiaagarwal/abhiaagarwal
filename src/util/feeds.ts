export interface FeedLink {
    type: "rss" | "atom" | "json";
    href: string;
    title: string;
}

export interface FeedConfig {
    rss: string;
    atom: string;
    json: string;
}

/**
 * Generate feed URLs for a specific folder or the main site
 */
export function generateFeedUrls(
    siteUrl: string,
    folderPath?: string,
): FeedConfig {
    if (folderPath) {
        // Folder-specific feeds
        return {
            rss: `${siteUrl}posts/${folderPath}.rss`,
            atom: `${siteUrl}posts/${folderPath}.atom`,
            json: `${siteUrl}posts/${folderPath}.json`,
        };
    } else {
        // Main site feeds
        return {
            rss: `${siteUrl}feed.rss`,
            atom: `${siteUrl}feed.atom`,
            json: `${siteUrl}feed.json`,
        };
    }
}

/**
 * Convert feed config to array of feed links with proper titles
 */
export function feedConfigToLinks(
    feeds: FeedConfig,
    contextTitle?: string,
): FeedLink[] {
    const suffix = contextTitle ? ` for ${contextTitle}` : "";

    return [
        {
            type: "rss",
            href: feeds.rss,
            title: `RSS feed${suffix}`,
        },
        {
            type: "atom",
            href: feeds.atom,
            title: `Atom feed${suffix}`,
        },
        {
            type: "json",
            href: feeds.json,
            title: `JSON feed${suffix}`,
        },
    ];
}
