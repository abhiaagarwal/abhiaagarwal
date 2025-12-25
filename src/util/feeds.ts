export interface FeedLink {
    type: "rss" | "atom";
    href: string;
    title: string;
}

export interface FeedConfig {
    rss: string;
    atom: string;
}

/**
 * Generate feed URLs for the main site
 */
export function generateFeedUrls(siteUrl: string): FeedConfig {
    return {
        rss: `${siteUrl}feed.rss`,
        atom: `${siteUrl}feed.atom`,
    };
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
    ];
}
