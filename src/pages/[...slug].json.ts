import type { APIRoute } from "astro";
import {
    blogIndex as blogIndexPromise,
    type HierarchicalBlogNode,
} from "../blogIndex";
import { FeedGenerator } from "../util/feedGenerator";

export async function getStaticPaths() {
    const allNodesMap = await blogIndexPromise;
    const paths = [];

    paths.push({
        params: { slug: "feed" },
        props: { currentNode: null },
    });

    for (const node of allNodesMap.values()) {
        if (node.isFolder) {
            paths.push({
                params: { slug: "posts/" + node.id },
                props: { currentNode: node },
            });
        }
    }

    return paths;
}

interface Props {
    currentNode: HierarchicalBlogNode | null;
}

export const GET: APIRoute = async ({ props, site }) => {
    const { currentNode } = props as Props;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const siteUrl = site!.toString();

    const feedGenerator = await FeedGenerator.create();

    const feedContent = currentNode
        ? await feedGenerator.generateFolderFeed(currentNode, siteUrl, "json")
        : await feedGenerator.generateMainFeed(siteUrl, "json");

    return new Response(feedContent, {
        headers: {
            "Content-Type": "application/feed+json; charset=utf-8",
        },
    });
};
