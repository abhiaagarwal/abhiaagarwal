import type { CollectionEntry } from "astro:content";
import type { PostItemData } from "../components/PostItem.astro";

export const PAGE_SIZE = 20;

export const bookmarkToPostItem = (
    bookmark: CollectionEntry<"bookmarks">,
): PostItemData => ({
    title: bookmark.data.title,
    description: bookmark.data.excerpt ?? bookmark.data.note,
    url: bookmark.data.url,
    date: bookmark.data.created,
});

export const getHostname = (url: string): string => {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return url;
    }
};

export const getTotalPages = (totalCount: number): number =>
    Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
