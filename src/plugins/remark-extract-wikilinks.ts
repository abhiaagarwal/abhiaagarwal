import type { Root } from "mdast";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";

export function remarkExtractWikiLinks() {
    return function (tree: Root, { data }: VFile) {
        const wikiLinks: string[] = [];
        visit(tree, "wikiLink", (node) => {
            if (node.data?.permalink) {
                wikiLinks.push(node.data.permalink);
            }
        });

        data.astro = data.astro || {};
        data.astro.frontmatter = data.astro.frontmatter || {};
        data.astro.frontmatter.internalLinks = wikiLinks;
    };
}
