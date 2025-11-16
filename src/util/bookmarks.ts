import type { CollectionEntry } from "astro:content";
import type { FilterItem } from "../components/FilterBar.astro";

export const PAGE_SIZE = 20;

export const getTotalPages = (totalCount: number): number =>
    Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

export const getSortedFilterItems = (
    bookmarks: CollectionEntry<"bookmarks">[],
): FilterItem[] => {
    const uniqueTags = [
        ...new Set(bookmarks.map((bookmark) => bookmark.data.tags).flat()),
    ];

    const tagCounts: Record<string, number> = {};
    for (const bookmark of bookmarks) {
        for (const tag of bookmark.data.tags) {
            tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
    }

    return uniqueTags
        .map((tag) => ({
            text: tag.toLowerCase(),
            value: tag,
            count: tagCounts[tag] ?? 0,
        }))
        .sort((a, b) => {
            if (a.count !== b.count) {
                return b.count - a.count;
            }
            return a.value.localeCompare(b.value);
        })
        .map(({ text, value }) => ({ text, value }));
};
